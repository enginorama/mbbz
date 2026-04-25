import { tokenizeExNativeString } from '@/ex-native/ExNativeTokenizer';
import { inject, type InjectionKey, type Ref } from 'vue';
import { useExNativeInputBus, useExStationInputBus } from './ExEventBus';

export const connectionInjectionKey = Symbol() as InjectionKey<{
  connect: () => Promise<void>;
  disconnect: () => void;
  connected: Readonly<Ref<boolean>>;
  connecting: Readonly<Ref<boolean>>;
}>;

export function useConnection() {
  const connection = inject(connectionInjectionKey);
  if (!connection) {
    throw new Error('No connection provided');
  }
  return connection;
}

export function setupDccInputBus() {
  const dccInputBus = useExNativeInputBus();
  const inputBus = useExStationInputBus();

  inputBus.on((data) => {
    const packets = tokenizeExNativeString(data);
    packets.forEach((packet) => {
      dccInputBus.emit(packet);
    });
  });
}
