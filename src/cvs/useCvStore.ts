import { useCommandStation } from '@/commandstation/useCommandStation';
import { defineStore } from 'pinia';
import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue';

export type CvValue = {
  value: number | undefined;
  fetching: boolean;
};

export const useCvStore = defineStore('cvs', () => {
  const commandStation = useCommandStation();
  const cvValues = ref<Map<number, CvValue>>(new Map());

  async function readCv(address: number) {
    cvValues.value.set(address, { value: undefined, fetching: true });
    const value = await commandStation.readCv(address);
    cvValues.value.set(address, { value: value, fetching: false });
  }

  function clearCv(address: number) {
    cvValues.value.delete(address);
  }

  function clear() {
    cvValues.value.clear();
  }

  return { cvValues, readCv, clearCv, clear };
});

export function useCvValue(address: MaybeRefOrGetter<number>) {
  const cvStore = useCvStore();

  return computed<CvValue | undefined>(() => {
    return cvStore.cvValues.get(toValue(address));
  });
}
