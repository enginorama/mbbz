import type { DccExCommand } from '@/protocols/DccEx';
import { useEventBus, type EventBusKey } from '@vueuse/core';

export const rawInputBus: EventBusKey<string> = Symbol('raw-input-bus');
export const rawOutputBus: EventBusKey<string> = Symbol('raw-output-bus');

export const dccInputBus: EventBusKey<DccExCommand> = Symbol('dcc-input-bus');

export function useDccInputBus() {
  return useEventBus(dccInputBus);
}

export function useRawOutputBus() {
  return useEventBus(rawOutputBus);
}
