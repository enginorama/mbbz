import { getSerialPorts, type SerialPortInfo } from '@/lib/getSerialPorts';
import { Channel, invoke, isTauri } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

export type TauriSerialConfig = {
  path: string;
  baudRate?: number;
};

export type TauriSerialConnectionStatus = 'connected' | 'disconnected';

const SERIAL_DISCONNECTED_EVENT = 'serial://disconnected';

export class ExTauriSerial {
  public static get isSupported() {
    return isTauri();
  }

  /**
   * Lists all available serial ports on the system via the Tauri backend.
   * Returns an empty array when not running inside Tauri.
   */
  public static async getAvailablePorts(): Promise<SerialPortInfo[]> {
    return getSerialPorts();
  }

  private connected = false;
  private dataChannel: Channel<string> | null = null;
  private unlistenDisconnect: UnlistenFn | null = null;

  private onDataCallback: (msg: string) => void;
  private onConnectionStatusChange: (status: TauriSerialConnectionStatus) => void;

  constructor({
    onData,
    onConnectionStatusChange,
  }: {
    onData: (msg: string) => void;
    onConnectionStatusChange: (status: TauriSerialConnectionStatus) => void;
  }) {
    this.onDataCallback = onData;
    this.onConnectionStatusChange = onConnectionStatusChange;
  }

  public async open(config?: TauriSerialConfig): Promise<boolean> {
    if (!ExTauriSerial.isSupported) return false;
    if (this.connected) return true;

    let path = config?.path;
    if (!path) {
      const ports = await getSerialPorts();
      const firstPort = ports[0];
      if (!firstPort) return false;
      path = firstPort.name;
    }

    this.dataChannel = new Channel<string>();
    this.dataChannel.onmessage = (msg) => {
      this.onDataCallback(msg);
    };

    await invoke('open_serial_port', {
      path,
      baudRate: config?.baudRate ?? 115200,
      onData: this.dataChannel,
    });

    // To put the system into a known state and stop it from echoing back the characters that we send it,
    // we need to send a CTRL-C and turn off the echo
    await invoke('write_serial_port', { data: '\x03\necho(false);\n\n' });

    this.unlistenDisconnect = await listen(SERIAL_DISCONNECTED_EVENT, () => {
      void this.close();
    });

    this.setConnected(true);
    return true;
  }

  public async close() {
    this.dataChannel = null;
    this.unlistenDisconnect?.();
    this.unlistenDisconnect = null;

    if (this.connected) {
      try {
        await invoke('close_serial_port');
      } catch (e) {
        console.warn('Error closing serial port:', e);
      }
    }
    this.setConnected(false);
  }

  public async writeToStream(...lines: Array<string>) {
    if (!this.connected || lines.length === 0) return;
    try {
      const data = lines.map((line) => `${line}\n`).join('');
      await invoke('write_serial_port', { data });
    } catch (e) {
      console.warn('Error writing to serial port:', e);
    }
  }

  private setConnected(connected: boolean) {
    this.connected = connected;
    const status: TauriSerialConnectionStatus = connected ? 'connected' : 'disconnected';
    this.onConnectionStatusChange(status);
  }
}
