import { ref } from 'vue';
import { toast } from 'vue-sonner';
import { useConnectionLogger } from '@/connections/useConnectionLogger';
import { useTransportStatusStore } from '@/connections/transports/useTransportStatusStore';
import type { DccTransport, TransportConnectOptions } from '@/connections/types';

export class WebSocketTransport implements DccTransport {
  readonly id = 'websocket' as const;
  readonly isSupported = true;
  readonly connected = ref(false);
  readonly connecting = ref(false);

  private socket: WebSocket | null = null;
  private dataHandler: (data: string) => void = () => {};
  private transportStatusStore = useTransportStatusStore();
  private log = useConnectionLogger().log;

  setDataHandler(fn: (data: string) => void) {
    this.dataHandler = fn;
  }

  connect(opts: TransportConnectOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      if (opts.kind !== 'websocket') {
        resolve(false);
        return;
      }
      if (this.socket) {
        toast.warning('Already connected');
        resolve(false);
        return;
      }
      this.connecting.value = true;
      try {
        this.socket = new WebSocket(opts.url, 'DCCEX');
        this.socket.addEventListener('open', () => {
          this.transportStatusStore.setStatus('websocket', 'connected');
          this.connected.value = true;
          this.connecting.value = false;
          this.log({ type: 'INFO', message: 'WebSocket connected.', transport: 'websocket' });
          resolve(true);
        });
        this.socket.addEventListener('message', (event) => {
          this.log({ type: 'IN', message: event.data, transport: 'websocket' });
          this.dataHandler(String(event.data));
        });
        this.socket.addEventListener('close', () => {
          this.transportStatusStore.setStatus('websocket', 'disconnected');
          this.connected.value = false;
          this.connecting.value = false;
          this.log({ type: 'INFO', message: 'WebSocket disconnected.', transport: 'websocket' });
          this.socket = null;
          resolve(false);
        });
        this.socket.addEventListener('error', (event) => {
          this.transportStatusStore.setStatus('websocket', 'disconnected');
          this.connected.value = false;
          this.connecting.value = false;
          toast.error('WebSocket error');
          console.error('WebSocket error:', event);
          this.socket = null;
          resolve(false);
        });
      } catch (e) {
        this.transportStatusStore.setStatus('websocket', 'disconnected');
        this.connected.value = false;
        this.connecting.value = false;
        toast.error('Failed to connect to WebSocket');
        console.error(e);
        this.socket = null;
        resolve(false);
      }
    });
  }

  disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    return Promise.resolve();
  }

  async send(data: string): Promise<void> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.log({ type: 'OUT', message: data, transport: 'websocket' });
      this.socket.send(data);
    }
  }
}