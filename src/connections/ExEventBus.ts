import type { DccExCommand } from '@/ex-native/ExNativeTokenizer';
import { useEventBus, type EventBusKey } from '@vueuse/core';

// The rest of the app consumes the DCC-EX protocol as *parsed packets*. Raw string I/O no longer
// flows through a global bus: the ConnectionManager decodes inbound data into packets and the
// CommandStation writes outbound commands directly to the active transport.
const exNativeInputBus: EventBusKey<DccExCommand> = Symbol('ex-native-input-bus');

export function useExNativeInputBus() {
  return useEventBus(exNativeInputBus);
}