<script setup lang="ts">
import AppNumberInput from '@/core/components/AppNumberInput.vue';
import PageLayout from '@/core/components/PageLayout.vue';
import Button from '@/core/components/ui/button/Button.vue';
import Item from '@/core/components/ui/item/Item.vue';
import CvTable from '@/cvs/cv-table/CvTable.vue';
import CvCard from '@/cvs/CvCard.vue';
import type { CvData } from '@/cvs/CvData';
import { useCvStore } from '@/cvs/useCvStore';
import { useCvActions } from '@/cvs/useCvActions';
import { DownloadIcon, PlusIcon } from '@lucide/vue';
import { computed, ref } from 'vue';

const cvs = ref(new Set<number>([1, 8, 29, 5, 6]));

const cvStore = useCvStore();
const { readCv, refreshAll } = useCvActions();

const cvAddressToAdd = ref<number>(1);

const sortedCvs = computed<CvData[]>(() => {
  return Array.from(cvs.value)
    .sort((a, b) => a - b)
    .map((address) => {
      const cvValue = cvStore.cvValues.get(address);
      return {
        address,
        title: `CV ${address}`,
        value: cvValue,
      };
    });
});

async function removeCv(address: number) {
  cvs.value.delete(address);
}

async function refreshCv(address: number) {
  await readCv(address);
}

async function refreshAllCvs() {
  await refreshAll(sortedCvs.value.map((cv) => cv.address));
}

function downloadCsv() {
  const header = '"Address","Title","Value"\n';
  const data = sortedCvs.value
    .map((cv) => `"${cv.address}","${cv.title}","${cv.value?.value ?? ''}"`)
    .join('\n');
  const blob = new Blob([`${header}${data}`], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cvs.csv';
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <PageLayout title="CVs" subtitle="Read and write CVs">
    <template #actions>
      <Button variant="default" class="rounded-full">
        <PlusIcon class="h-6" />{{ $t('pages.cvs.addCv') }}
      </Button>
    </template>
    <Item variant="muted" class="mb-4 flex items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <AppNumberInput v-model="cvAddressToAdd" :min="1" :max="1024" class="w-32" />
        <Button variant="outline" @click="cvs.add(cvAddressToAdd)">{{ $t('globals.add') }}</Button>
      </div>
      <div class="flex gap-2">
        <Button @click="downloadCsv"><DownloadIcon />{{ $t('globals.fileFormats.csv') }}</Button>
        <Button @click="refreshAllCvs">{{ $t('pages.cvs.refreshAll') }}</Button>
      </div>
    </Item>
    <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <CvCard
        v-for="cv in sortedCvs"
        class="min-w-1/4"
        :key="cv.address"
        :address="cv.address"
        :title="cv.title"
        :value="cv.value?.value"
        :fetching="cv.value?.fetching"
        @delete="removeCv"
        @refresh="refreshCv"
      />
    </div>
    <div class="mt-7">
      <CvTable :cvData="sortedCvs" />
    </div>
  </PageLayout>
</template>
