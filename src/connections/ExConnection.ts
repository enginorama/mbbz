import { tokenizeExNativeString } from '@/ex-native/ExNativeTokenizer';
import { useExNativeInputBus, useExStationInputBus } from './ExEventBus';

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
