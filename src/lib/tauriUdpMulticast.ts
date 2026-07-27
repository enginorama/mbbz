import { Channel, invoke, isTauri } from '@tauri-apps/api/core';

export const isUdpMulticastSupported = isTauri();

/**
 * Joins a UDP multicast group via the Tauri backend and invokes `onData` for every datagram
 * received, as raw text. Does nothing (and returns false) when not running inside Tauri.
 */
export async function startUdpMulticastListener(
  group: string,
  port: number,
  onData: (data: string) => void,
): Promise<boolean> {
  if (!isTauri()) return false;

  const channel = new Channel<string>();
  channel.onmessage = onData;
  await invoke('start_udp_multicast_listener', { group, port, onData: channel });
  return true;
}

export async function stopUdpMulticastListener(): Promise<void> {
  if (!isTauri()) return;
  try {
    await invoke('stop_udp_multicast_listener');
  } catch (e) {
    console.warn('Error stopping UDP multicast listener:', e);
  }
}

/**
 * Sends a command directly (unicast) to a command station's IP and port, over the same socket
 * used for the multicast listener. Requires a listener to already be running.
 */
export async function sendUdpMessage(address: string, port: number, data: string): Promise<void> {
  if (!isTauri()) return;
  await invoke('send_udp_message', { address, port, data });
}

/**
 * Whether a UDP multicast listener is currently running in the Tauri backend - notably, this
 * can be true immediately after a page reload, before anything in this session has called
 * startUdpMulticastListener, since the backend listener from before the reload keeps running.
 */
export async function isUdpMulticastListenerRunning(): Promise<boolean> {
  if (!isTauri()) return false;
  return await invoke<boolean>('is_udp_multicast_listener_running');
}
