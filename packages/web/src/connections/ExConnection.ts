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

export function provideWebSocketConnection() {
  const bus = useExStationInputBus();
  const dccInputBus = useExNativeInputBus();
  const outputBus = useExStationOutputBus();
  const { log } = useConnectionLogger();

  const { open, close, connected, writeToStream, getPorts } = useWebSerial((msg) => {
    bus.emit(msg);
    const packets = parseDccExString(msg);
    packets.forEach((packet) => {
      dccInputBus.emit(packet);
    });
    console.log(msg);
  });

  outputBus.on((msg) => {
    if (connected.value) {
      writeToStream(msg);
    }
  });

  bus.on((data) => {
    log({ type: 'IN', message: data });
  });

  outputBus.on((data) => {
    log({ type: 'OUT', message: data });
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
