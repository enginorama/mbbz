import { rawOutputBus, useDccInputBus } from '@/connections/connections';
import { useEventBus } from '@vueuse/core';
import { defineStore } from 'pinia';
import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue';

export type CvValue = {
  value: number | undefined;
  fetching: boolean;
};

export const useCvStore = defineStore('cvs', () => {
  const cvValues = ref<Map<number, CvValue>>(new Map());
  const dccInputBus = useDccInputBus();
  const dccOutputBus = useEventBus(rawOutputBus);

  async function readCv(address: number) {
    cvValues.value.set(address, { value: undefined, fetching: true });
    // TODO: Add better timeout and error handling as well as queueing
    const fetchedValue = await new Promise<number>((resolve) => {
      const off = dccInputBus.on((packet) => {
        if (packet.command === 'v' && Number(packet.params[0]) === address) {
          off();
          resolve(Number(packet.params[1] ?? -1));
        }
      });
      dccOutputBus.emit(`<R ${address}>`);
      setTimeout(() => {
        off();
        resolve(-1);
      }, 3000);
    });
    cvValues.value.set(address, { value: fetchedValue, fetching: false });
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
