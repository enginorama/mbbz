<script setup lang="ts">
import { NUM_CAB_FUNCTIONS } from '@/cabs/state/CabState';
import { useCab } from '@/cabs/state/useCab';
import PageMenuBar from '@/core/components/PageMenuBar.vue';
import PageTitle from '@/core/components/PageTitle.vue';
import Button from '@/core/components/ui/button/Button.vue';
import Item from '@/core/components/ui/item/Item.vue';
import NumberField from '@/core/components/ui/number-field/NumberField.vue';
import NumberFieldContent from '@/core/components/ui/number-field/NumberFieldContent.vue';
import NumberFieldDecrement from '@/core/components/ui/number-field/NumberFieldDecrement.vue';
import NumberFieldIncrement from '@/core/components/ui/number-field/NumberFieldIncrement.vue';
import NumberFieldInput from '@/core/components/ui/number-field/NumberFieldInput.vue';
import Slider from '@/core/components/ui/slider/Slider.vue';
import { useDebounceFn } from '@vueuse/core';
import { PauseIcon, PlayIcon, ShieldAlertIcon } from 'lucide-vue-next';
import { ref, watch } from 'vue';

const address = ref(3);
const cab = useCab(address);

const updateSpeed = useDebounceFn(
  (value: number[] | undefined) => {
    cab.setSpeed(value?.[0] ?? 0);
  },
  80,
  {
    maxWait: 80,
  },
);

watch(address, () => {
  cab.refresh();
});
</script>

<template>
  <div>
    <PageTitle title="Throttle" />
    <PageMenuBar>
      DCC Address
      <NumberField v-model="address" :min="1" :max="1024" class="w-32 bg-white">
        <NumberFieldContent>
          <NumberFieldDecrement />
          <NumberFieldInput />
          <NumberFieldIncrement />
        </NumberFieldContent>
      </NumberField>
    </PageMenuBar>
    <Item variant="outline" class="flex flex-col">
      <div class="flex items-center justify-center">
        <Slider
          :min-label="'Stop'"
          :min="0"
          :max="126"
          :step="1"
          orientation="vertical"
          class="mx-8 data-[orientation=vertical]:h-55"
          :model-value="[cab.state.value.speed]"
          @update:model-value="updateSpeed"
        />
        <div class="grid grid-cols-7 gap-2">
          <Button
            v-for="i in NUM_CAB_FUNCTIONS"
            :key="i"
            @click="cab.toggleFunction(i - 1)"
            :variant="cab.state.value.functionStates[i - 1] ? 'default' : 'outline'"
          >
            {{ i - 1 }}
          </Button>
        </div>
      </div>
      <div class="mt-4 flex gap-2">
        <Button
          class="size-10"
          @click="cab.setDirection('reverse', 0)"
          :variant="cab.state.value.direction === 'reverse' ? 'default' : 'outline'"
          ><PlayIcon class="rotate-180"
        /></Button>
        <Button
          class="size-10"
          :class="{ 'bg-destructive': cab.state.value.isEmergencyStopped }"
          @click="cab.setSpeed(0)"
          :variant="cab.state.value.speed === 0 ? 'default' : 'outline'"
          ><PauseIcon
        /></Button>
        <Button
          class="size-10"
          @click="cab.setDirection('forward', 0)"
          :variant="cab.state.value.direction === 'forward' ? 'default' : 'outline'"
          ><PlayIcon
        /></Button>
      </div>
      <Button
        class="size-10"
        :class="{ 'bg-destructive': cab.state.value.isEmergencyStopped }"
        @click="cab.setSpeed(-1)"
        :variant="cab.state.value.isEmergencyStopped ? 'default' : 'outline'"
        ><ShieldAlertIcon
      /></Button>
    </Item>
  </div>
</template>
