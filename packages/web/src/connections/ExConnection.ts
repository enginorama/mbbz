import { parseDccExString } from '@/protocols/DccEx';
import { inject, type InjectionKey, type Ref } from 'vue';
import { useExNativeInputBus, useExStationInputBus, useExStationOutputBus } from './ExEventBus';
import { useConnectionLogger } from './useConnectionLogger';

export const connectionInjectionKey = Symbol() as InjectionKey<{
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
