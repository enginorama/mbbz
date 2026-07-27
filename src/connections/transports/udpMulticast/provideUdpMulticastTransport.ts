import { ExNativeNormalizer } from '@/ex-native/ExNativeNormalizer';
import { inject, onUnmounted, provide, readonly, ref, watch, type InjectionKey, type Ref } from 'vue';
import { toast } from 'vue-sonner';
import { useExStationInputBus, useExStationOutputBus } from '../../ExEventBus';
import { useConnectionLogger } from '../../useConnectionLogger';
import { useTransportStatusStore } from '../useTransportStatusStore';
import { useUdpMulticast } from './useUdpMulticast';

export const udpMulticastTransportInjectionKey = Symbol('udp-multicast-transport') as InjectionKey<{
  connect: (group: string, deviceAddress: string, port: number) => Promise<void>;
  disconnect: () => Promise<void>;
  connected: Readonly<Ref<boolean>>;
  connecting: Readonly<Ref<boolean>>;
  isSupported: boolean;
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

  async function tryToConnect(group: string, deviceAddress: string, port: number) {
    try {
      connecting.value = true;
      await open(group, deviceAddress, port);
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

  provide(udpMulticastTransportInjectionKey, {
    connect: tryToConnect,
    disconnect: close,
    connected: readonly(connected),
    connecting: readonly(connecting),
    isSupported,
  });
}
