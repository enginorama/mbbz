<script setup lang="ts">
import { MinusIcon, PlusIcon } from '@lucide/vue';
import { NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput, NumberFieldRoot } from 'reka-ui';

</script>

<template>
  <NumberFieldRoot :focus-on-change="false"
    class="flex items-center border bg-white hover:bg-stone-50 rounded-lg shadow-sm h-9 focus-within:shadow-[0_0_0_2px] focus-within:shadow-stone-800">
    <NumberFieldDecrement class="p-2 disabled:opacity-20">
      <MinusIcon class="size-4" />
    </NumberFieldDecrement>
    <NumberFieldInput class="bg-transparent tabular-nums text-center focus:outline-0 p-1 shrink grow min-w-5" />
    <NumberFieldIncrement class="p-2 disabled:opacity-20">
      <PlusIcon class="size-4" />
    </NumberFieldIncrement>
  </NumberFieldRoot>
</template>
