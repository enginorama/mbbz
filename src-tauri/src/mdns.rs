use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex};

use mdns_sd::{ServiceDaemon, ServiceEvent};
use tauri::ipc::Channel;
use tauri::State;

// Meta-query defined by DNS-SD (RFC 6763 section 9) that enumerates every service *type*
// being advertised on the network, rather than instances of one specific type. We use it to
// discover types dynamically, then browse each one as it's found. Some minimal responders
// (e.g. the ESP32 Arduino MDNSResponder library used by DCC-EX WiFi command stations) don't
// reliably answer this enumeration query, so it's supplemented below with a fixed list of
// service types we always browse directly regardless of what the meta-query reports.
const META_SERVICE: &str = "_services._dns-sd._udp.local.";

const KNOWN_SERVICE_TYPES: &[&str] = &[
  "_dcc-ex._tcp.local.",
  "_dcc-ex._udp.local.",
  "_withrottle._tcp.local.",
  "_http._tcp.local.",
];

pub struct MdnsScan {
  daemon: ServiceDaemon,
}

pub type MdnsState = Mutex<Option<MdnsScan>>;

#[derive(Clone, serde::Serialize)]
pub struct MdnsServiceInfo {
  name: String,
  service_type: String,
  hostname: String,
  addresses: Vec<String>,
  port: u16,
  txt: HashMap<String, String>,
}

/// Starts browsing one specific service type and forwards every resolved instance to
/// `on_found`. Runs until the daemon backing `daemon` shuts down or `on_found` is dropped.
fn browse_service_type(daemon: &ServiceDaemon, service_type: String, on_found: Channel<MdnsServiceInfo>) {
  let Ok(receiver) = daemon.browse(&service_type) else {
    return;
  };
  std::thread::spawn(move || {
    while let Ok(event) = receiver.recv() {
      if let ServiceEvent::ServiceResolved(info) = event {
        let service = MdnsServiceInfo {
          name: info.get_fullname().to_string(),
          service_type: info.get_type().to_string(),
          hostname: info.get_hostname().to_string(),
          addresses: info.get_addresses().iter().map(|ip| ip.to_string()).collect(),
          port: info.get_port(),
          txt: info
            .get_properties()
            .iter()
            .map(|p| (p.key().to_string(), p.val_str().to_string()))
            .collect(),
        };
        if on_found.send(service).is_err() {
          break;
        }
      }
    }
  });
}

#[tauri::command]
pub fn start_mdns_scan(
  state: State<MdnsState>,
  on_found: Channel<MdnsServiceInfo>,
) -> Result<(), String> {
  let mut guard = state.lock().map_err(|e| e.to_string())?;
  if guard.is_some() {
    return Err("An mDNS scan is already running".into());
  }

  let daemon = ServiceDaemon::new().map_err(|e| e.to_string())?;

  // Service types we've already started a dedicated browse() for, so the meta-query
  // rediscovering a type we're already browsing (known or found earlier) doesn't spawn a
  // duplicate browsing thread.
  let seen_types: Arc<Mutex<HashSet<String>>> = Arc::new(Mutex::new(HashSet::new()));

  for &service_type in KNOWN_SERVICE_TYPES {
    seen_types.lock().map_err(|e| e.to_string())?.insert(service_type.to_string());
    browse_service_type(&daemon, service_type.to_string(), on_found.clone());
  }

  let meta_receiver = daemon.browse(META_SERVICE).map_err(|e| e.to_string())?;
  let type_browser_daemon = daemon.clone();

  std::thread::spawn(move || {
    while let Ok(event) = meta_receiver.recv() {
      let ServiceEvent::ServiceFound(_ty_domain, fullname) = event else {
        continue;
      };
      let is_new = seen_types
        .lock()
        .map(|mut seen| seen.insert(fullname.clone()))
        .unwrap_or(false);
      if !is_new {
        continue;
      }
      browse_service_type(&type_browser_daemon, fullname, on_found.clone());
    }
  });

  *guard = Some(MdnsScan { daemon });
  Ok(())
}

#[tauri::command]
pub fn stop_mdns_scan(state: State<MdnsState>) -> Result<(), String> {
  let mut guard = state.lock().map_err(|e| e.to_string())?;
  if let Some(scan) = guard.take() {
    let _ = scan.daemon.shutdown();
  }
  Ok(())
}
