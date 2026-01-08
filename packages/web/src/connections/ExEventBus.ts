import type { DccExCommand } from '@/protocols/DccEx';
import { useEventBus, type EventBusKey } from '@vueuse/core';

const exStationInputBus: EventBusKey<string> = Symbol('ex-station-input-bus');
const exStationOutputBus: EventBusKey<string> = Symbol('ex-station-output-bus');
const exNativeInputBus: EventBusKey<DccExCommand> = Symbol('ex-native-input-bus');

export function useExStationInputBus() {
  return useEventBus(exStationInputBus);
}

export function useExStationOutputBus() {
  return useEventBus(exStationOutputBus);
}

export function useExNativeInputBus() {
  return useEventBus(exNativeInputBus);
}
