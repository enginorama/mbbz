import { onUnmounted, provide, readonly, watch } from 'vue';
import { toast } from 'vue-sonner';
import { connectionInjectionKey } from '../ExConnection';
import { useExStationInputBus, useExStationOutputBus } from '../ExEventBus';
import { useConnectionLogger } from '../useConnectionLogger';
import { useWebSerial } from './useWebSerial';

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
