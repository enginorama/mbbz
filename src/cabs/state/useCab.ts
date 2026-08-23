import { useConnectionManager } from '@/connections/ConnectionManager';
import { toValue, type MaybeRefOrGetter } from 'vue';
import { type CabDirection } from './CabState';
import { useCabState } from './useCabState';

export function useCab(dccAddress: MaybeRefOrGetter<number>) {
  const connectionManager = useConnectionManager();
  const cabState = useCabState(dccAddress);

  function send(command: string) {
    void connectionManager.send(command);
  }

  function setSpeed(speed: number) {
    send(
      `<t 0 ${toValue(dccAddress)} ${speed} ${cabState.value.direction === 'forward' ? '1' : '0'}>`,
    );
  }

  function toggleFunction(index: number) {
    const value = !cabState.value.functionStates[index];
    send(`<F ${toValue(dccAddress)} ${index} ${value ? '1' : '0'}>`);
  }

  function setDirection(direction: CabDirection, speed: number) {
    send(`<t 0 ${toValue(dccAddress)} ${speed} ${direction === 'forward' ? '1' : '0'}>`);
  }

  function refresh() {
    send(`<t ${toValue(dccAddress)}>`);
  }

  return {
    state: cabState,
    setSpeed,
    toggleFunction,
    setDirection,
    refresh,
  };
}
