import { ExNativeNormalizer } from '@/ex-native/ExNativeNormalizer';
import { isUdpMulticastListenerRunning } from '@/lib/tauriUdpMulticast';
import { StorageSerializers, useStorage } from '@vueuse/core';
import { inject, onUnmounted, provide, readonly, ref, watch, type InjectionKey, type Ref } from 'vue';
import { toast } from 'vue-sonner';
import { useExStationInputBus, useExStationOutputBus } from '../../ExEventBus';
import { useConnectionLogger } from '../../useConnectionLogger';
import { useTransportStatusStore } from '../useTransportStatusStore';
import { useUdpMulticast } from './useUdpMulticast';

export interface UdpMulticastTarget {
  group: string;
  deviceAddress: string;
  port: number;
  label: string;
}

export const udpMulticastTransportInjectionKey = Symbol('udp-multicast-transport') as InjectionKey<{
  connect: (group: string, deviceAddress: string, port: number, label: string) => Promise<void>;
  disconnect: () => Promise<void>;
  connected: Readonly<Ref<boolean>>;
  connecting: Readonly<Ref<boolean>>;
  isSupported: boolean;
  lastTarget: Readonly<Ref<UdpMulticastTarget | null>>;
}>;

export function useUdpMulticastTransport() {
  const transport = inject(udpMulticastTransportInjectionKey);
  if (!transport) {
    throw new Error('UDP multicast transport not provided');
  }
  return transport;
}

export function provideUdpMulticastTransport() {
  const inputBus = useExStationInputBus();
  const outputBus = useExStationOutputBus();
  const transportStatusStore = useTransportStatusStore();
  const { log } = useConnectionLogger();

  const normalizer = new ExNativeNormalizer((line) => {
    log({ type: 'IN', message: line, transport: 'udpMulticast' });
    inputBus.emit(line);
  });

  const connecting = ref(false);

  // The default value is `null`, so useStorage can't guess an object serializer from it (it
  // falls back to stringifying via String(), i.e. the literal text "[object Object]") - it must
  // be specified explicitly.
  const lastTarget = useStorage<UdpMulticastTarget | null>('lastUdpMulticastTarget', null, undefined, {
    serializer: StorageSerializers.object,
  });

  const { open, close, send, connected, isSupported } = useUdpMulticast((msg) => {
    normalizer.parseChunk(msg);
  });

  // Broadcasts arrive via the multicast group, but commands are sent back unicast directly to
  // the device's own address (see useUdpMulticast) - the multicast group itself has no single
  // owner to reply as.
  outputBus.on((msg) => {
    if (connected.value) {
      log({ type: 'OUT', message: msg, transport: 'udpMulticast' });
      void send(msg);
    }
  });

  async function tryToConnect(group: string, deviceAddress: string, port: number, label: string) {
    try {
      connecting.value = true;
      await open(group, deviceAddress, port);
      if (connected.value) {
        lastTarget.value = { group, deviceAddress, port, label };
      }
    } catch (e) {
      toast.error('Failed to connect via UDP multicast');
      console.error(e);
    } finally {
      connecting.value = false;
    }
  }

  watch(connected, (newVal) => {
    if (newVal) {
      transportStatusStore.setStatus('udpMulticast', 'connected');
      log({ type: 'INFO', message: 'Connected.', transport: 'udpMulticast' });
    } else {
      transportStatusStore.setStatus('udpMulticast', 'disconnected');
      log({ type: 'INFO', message: 'Disconnected.', transport: 'udpMulticast' });
    }
  });

  onUnmounted(() => {
    if (connected.value) {
      void close();
    }
  });

  // The Tauri backend's listener is a separate process from this webview session - reloading
  // the page (e.g. F5) resets `connected` back to false here, but doesn't stop a listener that
  // was already running in the backend. Left alone, that listener is orphaned: its IPC channel
  // belonged to the webview session that just went away, so it can never deliver data again, yet
  // the UI shows "disconnected" as if nothing were happening. If we recognize this on startup,
  // reconnect using the last known target to rebind a fresh channel and correctly reflect the
  // real state; if we can't tell what it was for, just stop it instead of leaving it running.
  if (isSupported) {
    void (async () => {
      if (!(await isUdpMulticastListenerRunning())) return;
      if (lastTarget.value) {
        const { group, deviceAddress, port, label } = lastTarget.value;
        await tryToConnect(group, deviceAddress, port, label);
      } else {
        await close();
      }
    })();
  }

  provide(udpMulticastTransportInjectionKey, {
    connect: tryToConnect,
    disconnect: close,
    connected: readonly(connected),
    connecting: readonly(connecting),
    isSupported,
    lastTarget: readonly(lastTarget),
  });
}
