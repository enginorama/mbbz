import { defineStore } from 'pinia';
import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue';

export type CvValue = {
  value: number | undefined;
  fetching: boolean;
};

/**
 * Pure state store for CV values. It holds no dependencies on the command station — the actions
 * that talk to the station live in `useCvActions`, keeping the store simple and testable.
 */
export const useCvStore = defineStore('cvs', () => {
  const cvValues = ref<Map<number, CvValue>>(new Map());

  function setReading(address: number) {
    cvValues.value.set(address, { value: undefined, fetching: true });
  }

  function setValue(address: number, value: number) {
    cvValues.value.set(address, { value, fetching: false });
  }

  function clearCv(address: number) {
    cvValues.value.delete(address);
  }

  function clear() {
    cvValues.value.clear();
  }

  return { cvValues, setReading, setValue, clearCv, clear };
});

export function useCvValue(address: MaybeRefOrGetter<number>) {
  const cvStore = useCvStore();

  return computed<CvValue | undefined>(() => {
    return cvStore.cvValues.get(toValue(address));
  });
}