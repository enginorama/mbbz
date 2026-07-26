import { invoke } from '@tauri-apps/api/core';

export interface UsbPortInfo {
  vid: number;
  pid: number;
  serial_number: string | null;
  manufacturer: string | null;
  product: string | null;
}

export interface SerialPortInfo {
  name: string;
  port_type: string;
  usb_info: UsbPortInfo | null;
}

/**
 * Lists all available serial ports via the Tauri backend.
 * Returns an empty array if not running inside Tauri.
 */
export async function getSerialPorts(): Promise<SerialPortInfo[]> {
  try {
    return await invoke<SerialPortInfo[]>('list_serial_ports');
  } catch {
    // Not running in Tauri, or command failed
    return [];
  }
}
