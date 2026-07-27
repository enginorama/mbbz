mod mdns;
mod udp_multicast;

use std::io::{Read, Write};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{mpsc, Arc, Mutex};
use std::time::{Duration, Instant};

use mdns::MdnsState;
use tauri::ipc::Channel;
use tauri::{AppHandle, Emitter, State};
use udp_multicast::UdpMulticastState;

const SERIAL_DISCONNECTED_EVENT: &str = "serial://disconnected";

// Short I/O timeout so a lock is only ever held for a brief moment, whichever side has it.
const PORT_IO_TIMEOUT_MS: u64 = 10;
// How long write_serial_port will keep retrying to acquire the lock before giving up.
const PORT_LOCK_TIMEOUT_MS: u64 = 250;
// Our protocol is line-oriented, so a trailing '\n' is a reliable message boundary and lets
// the reader flush as soon as a line is complete rather than on a fixed timer. This safety
// net only fires for genuinely malformed/partial output (e.g. mid-boot noise) that never
// gets a trailing '\n' — normal traffic is always flushed at the newline, well before this.
const PARTIAL_LINE_FLUSH_IDLE_MS: u64 = 10;

type SharedPort = Arc<Mutex<Box<dyn serialport::SerialPort>>>;

struct SerialConnection {
  port: SharedPort,
  running: Arc<AtomicBool>,
}

type SerialState = Mutex<Option<SerialConnection>>;

/// Acquire the port lock cooperatively: never block on it outright. On contention, back off
/// with a short sleep and retry, so neither the reader thread nor a write command can starve
/// the other by immediately re-acquiring the instant it's released.
fn with_port_try_lock<T>(
  port: &SharedPort,
  lock_timeout: Duration,
  f: impl FnOnce(&mut Box<dyn serialport::SerialPort>) -> Result<T, String>,
) -> Result<T, String> {
  let deadline = Instant::now() + lock_timeout;
  loop {
    match port.try_lock() {
      Ok(mut guard) => {
        let _ = guard.set_timeout(Duration::from_millis(PORT_IO_TIMEOUT_MS));
        return f(&mut guard);
      }
      Err(_) if Instant::now() >= deadline => {
        return Err(format!(
          "serial port lock timeout after {} ms",
          lock_timeout.as_millis()
        ));
      }
      Err(_) => std::thread::sleep(Duration::from_millis(1)),
    }
  }
}

#[tauri::command]
fn list_serial_ports() -> Result<Vec<SerialPortInfo>, String> {
  serialport::available_ports()
    .map(|ports| {
      ports
        .into_iter()
        .map(|p| {
          let port_type = format!("{:?}", p.port_type);
          let usb_info = match p.port_type {
            serialport::SerialPortType::UsbPort(info) => Some(UsbPortInfo {
              vid: info.vid,
              pid: info.pid,
              serial_number: info.serial_number,
              manufacturer: info.manufacturer,
              product: info.product,
            }),
            _ => None,
          };
          SerialPortInfo {
            name: p.port_name,
            port_type,
            usb_info,
          }
        })
        .collect()
    })
    .map_err(|e| e.to_string())
}

#[tauri::command]
// The final flush_pending!() call on thread exit assigns pending_since one last time for
// no reason (the closure ends right after) — harmless, but silence the resulting lint.
#[allow(unused_assignments)]
fn open_serial_port(
  app: AppHandle,
  state: State<SerialState>,
  path: String,
  baud_rate: u32,
  on_data: Channel<String>,
) -> Result<(), String> {
  let mut guard = state.lock().map_err(|e| e.to_string())?;
  if guard.is_some() {
    return Err("A serial port is already open".into());
  }

  let port = serialport::new(&path, baud_rate)
    .timeout(Duration::from_millis(PORT_IO_TIMEOUT_MS))
    .dtr_on_open(false)
    .open()
    .map_err(|e| e.to_string())?;
  // A single shared handle, guarded cooperatively (see with_port_try_lock / the reader loop
  // below) rather than two independent OS handles via try_clone() — some USB-serial drivers
  // stall for seconds at a time when a COM port has two concurrently open handles.
  let port: SharedPort = Arc::new(Mutex::new(port));
  let reader_port = port.clone();

  let running = Arc::new(AtomicBool::new(true));
  let thread_running = running.clone();

  // Chunks are handed off through an in-process channel instead of being sent to the
  // webview directly from the read loop. A slow IPC round trip must never stall this
  // loop, or the OS's serial receive buffer can overflow and silently drop bytes while
  // we're not calling read().
  let (tx, rx) = mpsc::channel::<String>();

  std::thread::spawn(move || {
    let mut buf = [0u8; 4096];
    // Bytes read but not yet flushed to `tx` because they don't end in a complete line yet.
    let mut pending: Vec<u8> = Vec::new();
    let mut pending_since: Option<Instant> = None;

    // Flushes `pending` (if any) to `tx`. Returns true if the send failed (channel closed),
    // in which case the caller should stop the loop.
    macro_rules! flush_pending {
      () => {{
        let mut closed = false;
        if !pending.is_empty() {
          let text = String::from_utf8_lossy(&pending).into_owned();
          pending.clear();
          pending_since = None;
          closed = tx.send(text).is_err();
        }
        closed
      }};
    }

    while thread_running.load(Ordering::SeqCst) {
      let mut port = match reader_port.try_lock() {
        Ok(port) => port,
        Err(_) => {
          std::thread::sleep(Duration::from_millis(1));
          continue;
        }
      };
      let _ = port.set_timeout(Duration::from_millis(PORT_IO_TIMEOUT_MS));
      let read_result = port.read(&mut buf);
      drop(port);

      match read_result {
        Ok(n) if n > 0 => {
          pending.extend_from_slice(&buf[..n]);
          match pending.iter().rposition(|&b| b == b'\n') {
            Some(pos) => {
              let remainder = pending.split_off(pos + 1);
              let text = String::from_utf8_lossy(&pending).into_owned();
              pending = remainder;
              pending_since = if pending.is_empty() {
                None
              } else {
                Some(Instant::now())
              };
              if tx.send(text).is_err() {
                break;
              }
            }
            None => {
              pending_since.get_or_insert_with(Instant::now);
            }
          }
        }
        // No data this cycle — sleep before the next try_lock(), same as on contention.
        // Without this, the reader releases and immediately re-acquires the lock in a
        // tight loop, starving write_serial_port out for its entire retry window.
        Ok(_) => {
          let idle_long_enough = pending_since.is_some_and(|since| {
            since.elapsed() >= Duration::from_millis(PARTIAL_LINE_FLUSH_IDLE_MS)
          });
          if idle_long_enough && flush_pending!() {
            break;
          }
          std::thread::sleep(Duration::from_millis(1));
        }
        Err(e) if e.kind() == std::io::ErrorKind::TimedOut => {
          let idle_long_enough = pending_since.is_some_and(|since| {
            since.elapsed() >= Duration::from_millis(PARTIAL_LINE_FLUSH_IDLE_MS)
          });
          if idle_long_enough && flush_pending!() {
            break;
          }
          std::thread::sleep(Duration::from_millis(1));
        }
        Err(_) => break,
      }
    }
    flush_pending!();
    if thread_running.swap(false, Ordering::SeqCst) {
      let _ = app.emit(SERIAL_DISCONNECTED_EVENT, ());
    }
  });

  std::thread::spawn(move || {
    while let Ok(text) = rx.recv() {
      let _ = on_data.send(text);
    }
  });

  *guard = Some(SerialConnection { port, running });
  Ok(())
}

#[tauri::command]
fn close_serial_port(state: State<SerialState>) -> Result<(), String> {
  let mut guard = state.lock().map_err(|e| e.to_string())?;
  if let Some(connection) = guard.take() {
    connection.running.store(false, Ordering::SeqCst);
  }
  Ok(())
}

#[tauri::command]
fn write_serial_port(state: State<SerialState>, data: String) -> Result<(), String> {
  let guard = state.lock().map_err(|e| e.to_string())?;
  match guard.as_ref() {
    Some(connection) => with_port_try_lock(
      &connection.port,
      Duration::from_millis(PORT_LOCK_TIMEOUT_MS),
      |port| {
        port.write_all(data.as_bytes()).map_err(|e| e.to_string())?;
        // write_all alone doesn't guarantee the bytes actually leave the driver's TX buffer;
        // without an explicit flush they can sit there for a while before being transmitted.
        port.flush().map_err(|e| e.to_string())
      },
    ),
    None => Err("No serial port is open".into()),
  }
}

#[derive(serde::Serialize)]
struct SerialPortInfo {
  name: String,
  port_type: String,
  usb_info: Option<UsbPortInfo>,
}

#[derive(serde::Serialize)]
struct UsbPortInfo {
  vid: u16,
  pid: u16,
  serial_number: Option<String>,
  manufacturer: Option<String>,
  product: Option<String>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(SerialState::default())
    .manage(MdnsState::default())
    .manage(UdpMulticastState::default())
    .invoke_handler(tauri::generate_handler![
      list_serial_ports,
      open_serial_port,
      close_serial_port,
      write_serial_port,
      mdns::start_mdns_scan,
      mdns::stop_mdns_scan,
      udp_multicast::start_udp_multicast_listener,
      udp_multicast::stop_udp_multicast_listener,
      udp_multicast::send_udp_message,
      udp_multicast::is_udp_multicast_listener_running
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .target(tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Webview))
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
