import { ExNativeNormalizer } from '@/ex-native/ExNativeNormalizer';
import {
  inject,
  onUnmounted,
  provide,
  readonly,
  ref,
  watch,
  type InjectionKey,
  type Ref,
} from 'vue';
import { toast } from 'vue-sonner';
import { useExStationInputBus, useExStationOutputBus } from '../../ExEventBus';
import { useConnectionLogger } from '../../useConnectionLogger';
import { useTransportStatusStore } from '../useTransportStatusStore';
import { useWebSerial } from './useWebSerial';

export const webserialTransportInjectionKey = Symbol('webserial-transport') as InjectionKey<{
  connect: () => Promise<void>;
  disconnect: () => void;
  connected: Readonly<Ref<boolean>>;
  connecting: Readonly<Ref<boolean>>;
}>;

export function useWebSerialTransport() {
  const connection = inject(webserialTransportInjectionKey);
  if (!connection) {
    throw new Error('No connection provided');
  }
  return connection;
}

export function provideWebSerialTransport() {
  const inputBus = useExStationInputBus();
  const outputBus = useExStationOutputBus();
  const transportStatusStore = useTransportStatusStore();

  const { log } = useConnectionLogger();

  const normalizer = new ExNativeNormalizer((line) => {
    log({ type: 'IN', message: line, transport: 'webSerial' });
    inputBus.emit(line);
  });

  const connecting = ref(false);

  const { open, close, connected, writeToStream, getPorts } = useWebSerial((msg) => {
    normalizer.parseChunk(msg);
  });

  outputBus.on((msg) => {
    if (connected.value) {
      log({ type: 'OUT', message: msg, transport: 'webSerial' });
      void writeToStream(msg);
    }
  });

  async function tryToOpenConnection() {
    try {
      connecting.value = true;
      const ports = await getPorts();
      const firstPort = ports[0];
      if (firstPort && ports.length > 0) {
        await open({ port: firstPort });
        return;
      }
      await open();
    } catch (e) {
      toast.error('Failed to open port');
      console.error(e);
    } finally {
      connecting.value = false;
    }
  }

  watch(connected, (newVal) => {
    if (newVal) {
      transportStatusStore.setStatus('webSerial', 'connected');
      log({ type: 'INFO', message: 'Connected.', transport: 'webSerial' });
    } else {
      transportStatusStore.setStatus('webSerial', 'disconnected');
      log({ type: 'INFO', message: 'Disconnected.', transport: 'webSerial' });
    }
  });

  onUnmounted(() => {
    if (connected.value) {
      void close();
    }
  });

  provide(webserialTransportInjectionKey, {
    connect: tryToOpenConnection,
    connecting: readonly(connecting),
    disconnect: close,
    connected: readonly(connected),
  });
}
