import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { CabState } from './CabState';
import { useCabStatesStore } from './useCabStatesStore';

export function useCabState(dccAddress: MaybeRefOrGetter<number>) {
  const store = useCabStatesStore();
  return computed(
    () =>
      store.cabStates.get(toValue(dccAddress)) ??
      ({
        dccAddress: toValue(dccAddress),
        slot: -1,
        direction: 'forward',
        functionStates: Array(29).fill(false),
        isEmergencyStopped: false,
        speed: 0,
      } as CabState),
  );
}
