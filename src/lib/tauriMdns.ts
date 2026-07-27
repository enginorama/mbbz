import { Channel, invoke, isTauri } from '@tauri-apps/api/core';

export interface MdnsServiceInfo {
  name: string;
  serviceType: string;
  hostname: string;
  addresses: string[];
  port: number;
  txt: Record<string, string>;
}

export const isMdnsScanSupported = isTauri();

/**
 * Starts an mDNS scan via the Tauri backend, invoking `onService` for every service found
 * or updated. Does nothing (and returns false) when not running inside Tauri.
 */
export async function startMdnsScan(
  onService: (service: MdnsServiceInfo) => void,
): Promise<boolean> {
  if (!isTauri()) return false;

  const channel = new Channel<MdnsServiceInfo>();
  channel.onmessage = onService;
  await invoke('start_mdns_scan', { onFound: channel });
  return true;
}

export async function stopMdnsScan(): Promise<void> {
  if (!isTauri()) return;
  try {
    await invoke('stop_mdns_scan');
  } catch (e) {
    console.warn('Error stopping mDNS scan:', e);
  }
}
