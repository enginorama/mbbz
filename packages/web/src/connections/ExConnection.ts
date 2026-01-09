import { parseDccExString } from '@/protocols/DccEx';
import { inject, onUnmounted, provide, readonly, watch, type InjectionKey, type Ref } from 'vue';
import { toast } from 'vue-sonner';
import { useExNativeInputBus, useExStationInputBus, useExStationOutputBus } from './ExEventBus';
import { useConnectionLogger } from './useConnectionLogger';
import { useWebSerial } from './useWebSerial';

const connectionInjectionKey = Symbol() as InjectionKey<{
  connect: () => Promise<void>;
  disconnect: () => void;
  connected: Readonly<Ref<boolean>>;
}>;

export function useConnection() {
  const connection = inject(connectionInjectionKey);
  if (!connection) {
    throw new Error('No connection provided');
  }
  return connection;
}

export function setupBusLogger() {
  const { log } = useConnectionLogger();
  const inputBus = useExStationInputBus();
  const outputBus = useExStationOutputBus();

  inputBus.on((data) => {
    log({ type: 'IN', message: data });
  });

  outputBus.on((data) => {
    log({ type: 'OUT', message: data });
  });
}

export function setupDccInputBus() {
  const dccInputBus = useExNativeInputBus();
  const inputBus = useExStationInputBus();

  inputBus.on((data) => {
    const packets = parseDccExString(data);
    packets.forEach((packet) => {
      dccInputBus.emit(packet);
    });
  });
}

export function provideWebSerialConnection() {
  const inputBus = useExStationInputBus();
  const outputBus = useExStationOutputBus();
  const { log } = useConnectionLogger();

  const { open, close, connected, writeToStream, getPorts } = useWebSerial((msg) => {
    inputBus.emit(msg);
  });

  outputBus.on((msg) => {
    if (connected.value) {
      writeToStream(msg);
    }
  });

  async function tryToOpenConnection() {
    try {
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
    }
  }

  watch(connected, (newVal) => {
    if (newVal) {
      log({ type: 'INFO', message: 'Connected.' });
    } else {
      log({ type: 'INFO', message: 'Disconnected.' });
    }
  });

  onUnmounted(() => {
    if (connected.value) {
      close();
    }
  });

  provide(connectionInjectionKey, {
    connect: tryToOpenConnection,
    disconnect: close,
    connected: readonly(connected),
  });
}
