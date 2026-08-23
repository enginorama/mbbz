import { ref } from 'vue';
import { toast } from 'vue-sonner';
import { ExTauriSerial } from '@/connections/transports/serial/ExTauriSerial';
import type { SerialPortInfo } from '@/lib/getSerialPorts';
import { useConnectionLogger } from '@/connections/useConnectionLogger';
import { useTransportStatusStore } from '@/connections/transports/useTransportStatusStore';
import type { DccTransport, TransportConnectOptions } from '@/connections/types';

export class TauriSerialTransport implements DccTransport {
  readonly id = 'tauriSerial' as const;
  readonly isSupported = ExTauriSerial.isSupported;
  readonly connected = ref(false);
  readonly connecting = ref(false);

  private ex: ExTauriSerial | null = null;
  private dataHandler: (data: string) => void = () => {};
  private transportStatusStore = useTransportStatusStore();
  private log = useConnectionLogger().log;

  setDataHandler(fn: (data: string) => void) {
    this.dataHandler = fn;
  }

  async connect(opts: TransportConnectOptions): Promise<boolean> {
    if (opts.kind !== 'tauriSerial') return false;
    if (!this.isSupported) return false;
    if (this.connected.value) return true;

    this.connecting.value = true;
    try {
      this.ex = new ExTauriSerial({
        onData: (msg) => {
          this.log({ type: 'IN', message: msg, transport: 'tauriSerial' });
          this.dataHandler(msg);
        },
        onConnectionStatusChange: (status) => {
          const connected = status === 'connected';
          this.connected.value = connected;
          this.transportStatusStore.setStatus(
            'tauriSerial',
            connected ? 'connected' : 'disconnected',
          );
          this.log({
            type: 'INFO',
            message: connected ? 'Connected.' : 'Disconnected.',
            transport: 'tauriSerial',
          });
        },
      });
      const ok = await this.ex.open(opts.path ? { path: opts.path } : undefined);
      return ok;
    } catch (e) {
      toast.error('Failed to open serial port');
      console.error(e);
      return false;
    } finally {
      this.connecting.value = false;
    }
  }

  async disconnect(): Promise<void> {
    await this.ex?.close();
  }

  async getAvailablePorts(): Promise<SerialPortInfo[]> {
    return ExTauriSerial.getAvailablePorts();
  }

  async send(data: string): Promise<void> {
    if (!this.connected.value) return;
    this.log({ type: 'OUT', message: data, transport: 'tauriSerial' });
    await this.ex?.writeToStream(data);
  }
}