import { ExNativeNormalizer } from '@/protocols/ExNativeNormalizer';
import { onUnmounted, provide, readonly, ref, watch } from 'vue';
import { toast } from 'vue-sonner';
import { connectionInjectionKey } from '../ExConnection';
import { useExStationInputBus, useExStationOutputBus } from '../ExEventBus';
import { useConnectionLogger } from '../useConnectionLogger';
import { useTransportStatusStore } from './useTransportStatusStore';
import { useWebSerial } from './useWebSerial';

export function provideWebSerialConnection() {
  const inputBus = useExStationInputBus();
  const outputBus = useExStationOutputBus();
  const transportStatusStore = useTransportStatusStore();
  const normalizer = new ExNativeNormalizer();

  const { log } = useConnectionLogger();
  const connecting = ref(false);

  const { open, close, connected, writeToStream, getPorts } = useWebSerial((msg) => {
    normalizer.parseChunk(msg, (line) => {
      inputBus.emit(line);
    });
  });

  outputBus.on((msg) => {
    if (connected.value) {
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
      log({ type: 'INFO', message: 'Connected.' });
    } else {
      transportStatusStore.setStatus('webSerial', 'disconnected');
      log({ type: 'INFO', message: 'Disconnected.' });
    }
  });

  onUnmounted(() => {
    if (connected.value) {
      void close();
    }
  });

  provide(connectionInjectionKey, {
    connect: tryToOpenConnection,
    connecting: readonly(connecting),
    disconnect: close,
    connected: readonly(connected),
  });
}
