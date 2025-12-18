<script setup lang="ts">
import PageTitle from '@/core/components/PageTitle.vue';
import Button from '@/core/components/ui/button/Button.vue';
import Item from '@/core/components/ui/item/Item.vue';
import NumberField from '@/core/components/ui/number-field/NumberField.vue';
import NumberFieldContent from '@/core/components/ui/number-field/NumberFieldContent.vue';
import NumberFieldDecrement from '@/core/components/ui/number-field/NumberFieldDecrement.vue';
import NumberFieldIncrement from '@/core/components/ui/number-field/NumberFieldIncrement.vue';
import NumberFieldInput from '@/core/components/ui/number-field/NumberFieldInput.vue';
import CvCard from '@/cvs/CvCard.vue';
import { useCvStore } from '@/stores/useCvStore';
import { PlusIcon } from 'lucide-vue-next';
import { computed, ref } from 'vue';

const cvs = ref(new Set<number>([1, 8, 29, 5, 6]));

const cvStore = useCvStore();

const cvAddressToAdd = ref<number>(1);

const sortedCvs = computed(() => {
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
  await cvStore.readCv(address);
}

async function refreshAllCvs() {
  for (const address of cvs.value) {
    await cvStore.readCv(address);
  }
}
</script>

<template>
  <div>
    <PageTitle title="CVs" subtitle="Read and write CVs" class="mb-6">
      <Button variant="default" class="rounded-full"><PlusIcon class="h-6" />CV hinzufügen</Button>
    </PageTitle>
    <Item variant="muted" class="mb-4 flex items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <NumberField v-model="cvAddressToAdd" :min="1" :max="1024" class="w-32 bg-white">
          <NumberFieldContent>
            <NumberFieldDecrement />
            <NumberFieldInput @keydown.enter="cvs.add(cvAddressToAdd)" />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>
        <Button variant="outline" @click="cvs.add(cvAddressToAdd)">Hinzufügen</Button>
      </div>
      <Button @click="refreshAllCvs">Refresh all</Button>
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
  </div>
</template>
