import { ref } from 'vue';
import { toast } from 'vue-sonner';
import { ExWebSerial } from '@/connections/transports/serial/ExWebSerial';
import { useConnectionLogger } from '@/connections/useConnectionLogger';
import { useTransportStatusStore } from '@/connections/transports/useTransportStatusStore';
import type { DccTransport, TransportConnectOptions } from '@/connections/types';

export class WebSerialTransport implements DccTransport<'webSerial'> {
  readonly id = 'webSerial' as const;
  readonly isSupported = typeof navigator !== 'undefined' && 'serial' in navigator;
  readonly connected = ref(false);
  readonly connecting = ref(false);

  private ex: ExWebSerial | null = null;
  private dataHandler: (data: string) => void = () => {};
  private transportStatusStore = useTransportStatusStore();
  private log = useConnectionLogger().log;

  setDataHandler(fn: (data: string) => void) {
    this.dataHandler = fn;
  }

  async connect(opts: TransportConnectOptions<'webSerial'>): Promise<boolean> {
    if (!this.isSupported) return false;
    if (this.connected.value) return true;

    this.connecting.value = true;
    try {
      this.ex = new ExWebSerial({
        onData: (msg) => {
          this.log({ type: 'IN', message: msg, transport: 'webSerial' });
          this.dataHandler(msg);
        },
        onConnectionStatusChange: (status) => {
          const connected = status === 'connected';
          this.connected.value = connected;
          this.transportStatusStore.setStatus(
            'webSerial',
            connected ? 'connected' : 'disconnected',
          );
          this.log({
            type: 'INFO',
            message: connected ? 'Connected.' : 'Disconnected.',
            transport: 'webSerial',
          });
        },
      });

      const ports = await this.ex.getPorts();
      const port = opts.port ?? ports[0];
      const ok = await this.ex.open(port ? { port } : undefined);
      return ok;
    } catch (e) {
      toast.error('Failed to open port');
      console.error(e);
      return false;
    } finally {
      this.connecting.value = false;
    }
  }

  async disconnect(): Promise<void> {
    await this.ex?.close();
  }

  async send(data: string): Promise<void> {
    if (!this.connected.value) return;
    this.log({ type: 'OUT', message: data, transport: 'webSerial' });
    await this.ex?.writeToStream(data);
  }
}
