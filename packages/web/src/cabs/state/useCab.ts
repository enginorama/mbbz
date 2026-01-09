import { useExStationOutputBus } from '@/connections/ExEventBus';
import { toValue, type MaybeRefOrGetter } from 'vue';
import { type CabDirection } from './CabState';
import { useCabState } from './useCabState';

export function useCab(dccAddress: MaybeRefOrGetter<number>) {
  const { emit } = useExStationOutputBus();

  const cabState = useCabState(dccAddress);

  function setSpeed(speed: number) {
    void emit(
      `<t 0 ${toValue(dccAddress)} ${speed} ${cabState.value.direction === 'forward' ? '1' : '0'}>`,
    );
  }

  function toggleFunction(index: number) {
    const value = !cabState.value.functionStates[index];
    void emit(`<F ${toValue(dccAddress)} ${index} ${value ? '1' : '0'}>`);
  }

  function setDirection(direction: CabDirection, speed: number) {
    void emit(`<t 0 ${toValue(dccAddress)} ${speed} ${direction === 'forward' ? '1' : '0'}>`);
  }

  function refresh() {
    void emit(`<t ${toValue(dccAddress)}>`);
  }

  return {
    state: cabState,
    setSpeed,
    toggleFunction,
    setDirection,
    refresh,
  };
}
