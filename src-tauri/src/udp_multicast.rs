use std::net::{Ipv4Addr, SocketAddrV4, UdpSocket};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use socket2::{Domain, Protocol, Socket, Type};
use tauri::ipc::Channel;
use tauri::State;

// Read timeout for recv_from(): bounds how long stop_udp_multicast_listener takes to actually
// end the listener thread, since there's no other way to interrupt a blocking recv on a plain
// UdpSocket.
const RECV_TIMEOUT_MS: u64 = 200;

pub struct UdpMulticastListener {
  running: Arc<AtomicBool>,
  // Handle used for sending commands back to the command station. It's a separate clone of the
  // same underlying OS socket the listener thread reads from (both a unicast reply and the
  // multicast broadcasts arrive on the same port from the device's point of view), so sending
  // doesn't have to fight the listener thread's blocking recv_from() for the socket.
  socket: UdpSocket,
}

pub type UdpMulticastState = Mutex<Option<UdpMulticastListener>>;

#[tauri::command]
pub fn start_udp_multicast_listener(
  state: State<UdpMulticastState>,
  group: String,
  port: u16,
  on_data: Channel<String>,
) -> Result<(), String> {
  let mut guard = state.lock().map_err(|e| e.to_string())?;
  if guard.is_some() {
    return Err("A UDP multicast listener is already running".into());
  }

  let group_addr: Ipv4Addr = group
    .parse()
    .map_err(|_| format!("Invalid multicast group address: {group}"))?;

  // Built via socket2 (rather than std::net::UdpSocket::bind directly) so SO_REUSEADDR can be
  // set before binding, letting other processes on the machine (e.g. another mDNS/discovery
  // tool) share the same multicast port instead of failing to bind.
  let socket = Socket::new(Domain::IPV4, Type::DGRAM, Some(Protocol::UDP)).map_err(|e| e.to_string())?;
  socket.set_reuse_address(true).map_err(|e| e.to_string())?;
  let bind_addr = SocketAddrV4::new(Ipv4Addr::UNSPECIFIED, port);
  socket.bind(&bind_addr.into()).map_err(|e| e.to_string())?;

  // Joining on Ipv4Addr::UNSPECIFIED leaves the choice of interface up to the OS, which on a
  // machine with several adapters (VPN, WSL, Hyper-V virtual switches, ...) can silently pick
  // one that never sees the device's traffic. Instead, join explicitly on every local IPv4
  // interface, the same way the mdns-sd crate does for its own multicast membership.
  let interfaces = if_addrs::get_if_addrs().map_err(|e| e.to_string())?;
  let mut joined_any = false;
  for iface in interfaces {
    if iface.is_loopback() {
      continue;
    }
    let std::net::IpAddr::V4(iface_addr) = iface.ip() else {
      continue;
    };
    if socket.join_multicast_v4(&group_addr, &iface_addr).is_ok() {
      joined_any = true;
    }
  }
  if !joined_any {
    return Err("Failed to join the multicast group on any network interface".into());
  }

  socket
    .set_read_timeout(Some(Duration::from_millis(RECV_TIMEOUT_MS)))
    .map_err(|e| e.to_string())?;

  let udp_socket: UdpSocket = socket.into();
  let send_socket = udp_socket.try_clone().map_err(|e| e.to_string())?;

  let running = Arc::new(AtomicBool::new(true));
  let thread_running = running.clone();

  std::thread::spawn(move || {
    let mut buf = [0u8; 2048];
    while thread_running.load(Ordering::SeqCst) {
      match udp_socket.recv_from(&mut buf) {
        Ok((n, _src)) => {
          let text = String::from_utf8_lossy(&buf[..n]).into_owned();
          if on_data.send(text).is_err() {
            break;
          }
        }
        Err(e)
          if e.kind() == std::io::ErrorKind::WouldBlock || e.kind() == std::io::ErrorKind::TimedOut =>
        {
          continue;
        }
        Err(_) => break,
      }
    }
  });

  *guard = Some(UdpMulticastListener {
    running,
    socket: send_socket,
  });
  Ok(())
}

#[tauri::command]
pub fn stop_udp_multicast_listener(state: State<UdpMulticastState>) -> Result<(), String> {
  let mut guard = state.lock().map_err(|e| e.to_string())?;
  if let Some(listener) = guard.take() {
    listener.running.store(false, Ordering::SeqCst);
  }
  Ok(())
}

#[tauri::command]
pub fn send_udp_message(
  state: State<UdpMulticastState>,
  address: String,
  port: u16,
  data: String,
) -> Result<(), String> {
  let guard = state.lock().map_err(|e| e.to_string())?;
  let listener = guard
    .as_ref()
    .ok_or("No UDP multicast listener is running")?;

  let target_addr: Ipv4Addr = address
    .parse()
    .map_err(|_| format!("Invalid target address: {address}"))?;
  listener
    .socket
    .send_to(data.as_bytes(), SocketAddrV4::new(target_addr, port))
    .map_err(|e| e.to_string())?;
  Ok(())
}
