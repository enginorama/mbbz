<script setup lang="ts">
import PageTitle from '@/core/components/PageTitle.vue';
import Button from '@/core/components/ui/button/Button.vue';
import { useAppDialog } from '@/core/dialogs/useAppDialog';
import CvCard from '@/cvs/CvCard.vue';
import { PlusIcon } from 'lucide-vue-next';
import { computed, ref } from 'vue';

const cvs = ref(new Set<number>([1, 8, 29]));

const cvValues = ref(new Map<number, { value: number | undefined; fetching: boolean }>());

const sortedCvs = computed(() => {
  return Array.from(cvs.value)
    .sort((a, b) => a - b)
    .map((address) => {
      const cvValue = cvValues.value.get(address);
      return {
        address,
        title: `CV ${address}`,
        value: address + 5,
      };
    });
});

const { show } = useAppDialog();

const test = ref(false);
const counter = ref(0);

async function removeCv(address: number) {
  // test.value = false;
  // const dialogreturn = await show(AppDialog, () => ({
  //   show: test.value,
  //   title: `CV ${address} löschen? ${counter.value}`,
  // }));
  // console.log('Dialog returned:', dialogreturn);
  // console.log('Removing CV at address:', address);
  // setTimeout(() => {
  //   counter.value += 1;
  // }, 1000);
  // cvs.value.delete(address);
}
</script>

<template>
  <div>
    <PageTitle title="CVs" subtitle="Read and write CVs" class="mb-6">
      <Button variant="default" class="rounded-full"><PlusIcon class="h-6" />CV hinzufügen</Button>
    </PageTitle>
    <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <CvCard
        v-for="cv in sortedCvs"
        class="min-w-1/4"
        :key="cv.address"
        :address="cv.address"
        :title="cv.title"
        :value="cv.value"
        @delete="removeCv"
      />
    </div>
  </div>
</template>
