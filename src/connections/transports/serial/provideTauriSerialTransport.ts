import { ExNativeNormalizer } from '@/ex-native/ExNativeNormalizer';
import type { SerialPortInfo } from '@/lib/getSerialPorts';
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
import { useTauriSerial } from './useTauriSerial';

export const tauriSerialTransportInjectionKey = Symbol('tauri-serial-transport') as InjectionKey<{
  connect: (path?: string) => Promise<void>;
  disconnect: () => void;
  connected: Readonly<Ref<boolean>>;
  connecting: Readonly<Ref<boolean>>;
  isSupported: boolean;
  getAvailablePorts: () => Promise<SerialPortInfo[]>;
}>;

export function useTauriSerialTransport() {
  const connection = inject(tauriSerialTransportInjectionKey);
  if (!connection) {
    throw new Error('No connection provided');
  }
  return connection;
}

export function provideTauriSerialTransport() {
  const inputBus = useExStationInputBus();
  const outputBus = useExStationOutputBus();
  const transportStatusStore = useTransportStatusStore();

  const { log } = useConnectionLogger();

  const normalizer = new ExNativeNormalizer((line) => {
    log({ type: 'IN', message: line, transport: 'tauriSerial' });
    inputBus.emit(line);
  });

  const connecting = ref(false);

  const { open, close, connected, writeToStream, isSupported, getAvailablePorts } =
    useTauriSerial((msg) => {
      normalizer.parseChunk(msg);
    });

  outputBus.on((msg) => {
    if (connected.value) {
      log({ type: 'OUT', message: msg, transport: 'tauriSerial' });
      void writeToStream(msg);
    }
  });

  async function tryToOpenConnection(path?: string) {
    try {
      connecting.value = true;
      await open(path ? { path } : undefined);
    } catch (e) {
      toast.error('Failed to open serial port');
      console.error(e);
    } finally {
      connecting.value = false;
    }
  }

  watch(connected, (newVal) => {
    if (newVal) {
      transportStatusStore.setStatus('tauriSerial', 'connected');
      log({ type: 'INFO', message: 'Connected.', transport: 'tauriSerial' });
    } else {
      transportStatusStore.setStatus('tauriSerial', 'disconnected');
      log({ type: 'INFO', message: 'Disconnected.', transport: 'tauriSerial' });
    }
  });

  onUnmounted(() => {
    if (connected.value) {
      void close();
    }
  });

  provide(tauriSerialTransportInjectionKey, {
    connect: tryToOpenConnection,
    connecting: readonly(connecting),
    disconnect: close,
    connected: readonly(connected),
    isSupported,
    getAvailablePorts,
  });
}
