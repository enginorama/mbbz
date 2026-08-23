import { useStorage, StorageSerializers } from '@vueuse/core';
import { ref } from 'vue';
import { toast } from 'vue-sonner';
import {
  isUdpMulticastSupported,
  isUdpMulticastListenerRunning,
  sendUdpMessage,
  startUdpMulticastListener,
  stopUdpMulticastListener,
} from '@/lib/tauriUdpMulticast';
import { useConnectionLogger } from '@/connections/useConnectionLogger';
import { useTransportStatusStore } from '@/connections/transports/useTransportStatusStore';
import type { DccTransport, TransportConnectOptions } from '@/connections/types';

interface UdpMulticastTarget {
  group: string;
  deviceAddress: string;
  port: number;
  label: string;
}

export class UdpMulticastTransport implements DccTransport<'udpMulticast'> {
  readonly id = 'udpMulticast' as const;
  readonly isSupported = isUdpMulticastSupported;
  readonly connected = ref(false);
  readonly connecting = ref(false);

  // The default value is `null`, so useStorage can't guess an object serializer from it (it
  // falls back to stringifying via String(), i.e. the literal text "[object Object]").
  readonly lastTarget = useStorage<UdpMulticastTarget | null>(
    'lastUdpMulticastTarget',
    null,
    undefined,
    {
      serializer: StorageSerializers.object,
    },
  );

  // Commands are sent unicast directly to the command station's own address, not to the
  // multicast group (which has no listener able to reply as a specific device).
  private sendTarget: { address: string; port: number } | null = null;
  private dataHandler: (data: string) => void = () => {};
  private transportStatusStore = useTransportStatusStore();
  private log = useConnectionLogger().log;

  setDataHandler(fn: (data: string) => void) {
    this.dataHandler = fn;
  }

  async connect(opts: TransportConnectOptions<'udpMulticast'>): Promise<boolean> {
    this.connecting.value = true;
    try {
      const started = await startUdpMulticastListener(opts.group, opts.port, (data) => {
        this.log({ type: 'IN', message: data, transport: 'udpMulticast' });
        this.dataHandler(data);
      });
      this.connected.value = started;
      this.sendTarget = started ? { address: opts.deviceAddress, port: opts.port } : null;
      if (started) {
        this.lastTarget.value = {
          group: opts.group,
          deviceAddress: opts.deviceAddress,
          port: opts.port,
          label: opts.label ?? opts.deviceAddress,
        };
        this.transportStatusStore.setStatus('udpMulticast', 'connected');
        this.log({ type: 'INFO', message: 'Connected.', transport: 'udpMulticast' });
      }
      return started;
    } catch (e) {
      toast.error('Failed to connect via UDP multicast');
      console.error(e);
      return false;
    } finally {
      this.connecting.value = false;
    }
  }

  async disconnect(): Promise<void> {
    await stopUdpMulticastListener();
    this.connected.value = false;
    this.sendTarget = null;
    this.transportStatusStore.setStatus('udpMulticast', 'disconnected');
    this.log({ type: 'INFO', message: 'Disconnected.', transport: 'udpMulticast' });
  }

  async send(data: string): Promise<void> {
    if (!this.sendTarget) return;
    this.log({ type: 'OUT', message: data, transport: 'udpMulticast' });
    await sendUdpMessage(this.sendTarget.address, this.sendTarget.port, data);
  }

  /**
   * The Tauri backend's listener is a separate process from this webview session - reloading
   * the page (e.g. F5) resets `connected` back to false here, but doesn't stop a listener that
   * was already running in the backend. Left alone, that listener is orphaned: its IPC channel
   * belonged to the webview session that just went away, so it can never deliver data again, yet
   * the UI shows "disconnected". If we recognize this on startup, reconnect using the last known
   * target to rebind a fresh channel; if we can't tell what it was for, stop it instead.
   */
  async restore(): Promise<void> {
    if (!this.isSupported) return;
    if (!(await isUdpMulticastListenerRunning())) return;
    if (this.lastTarget.value) {
      const { group, deviceAddress, port, label } = this.lastTarget.value;
      await this.connect({ kind: 'udpMulticast', group, deviceAddress, port, label });
    } else {
      await this.disconnect();
    }
  }
}
