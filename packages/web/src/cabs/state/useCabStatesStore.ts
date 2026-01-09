import { defineStore } from 'pinia';
import { readonly, ref } from 'vue';
import type { CabState } from './CabState';

export const useCabStatesStore = defineStore('cab-states-store', () => {
  const cabStates = ref(new Map<number, CabState>());

  function update(state: CabState) {
    cabStates.value.set(state.dccAddress, state);
  }

  function get(dccAddress: number): CabState {
    return (
      cabStates.value.get(dccAddress) ?? {
        dccAddress,
        slot: -1,
        direction: 'forward',
        functionStates: Array(29).fill(false),
        isEmergencyStopped: false,
        speed: 0,
      }
    );
  }

  function reset() {
    cabStates.value.clear();
  }

  return {
    cabStates: readonly(cabStates),
    update,
    get,
    reset,
  };
});
