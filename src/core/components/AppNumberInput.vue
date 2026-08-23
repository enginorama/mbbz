<script setup lang="ts">
import { MinusIcon, PlusIcon } from '@lucide/vue';
import {
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldRoot,
} from 'reka-ui';
</script>

<template>
  <NumberFieldRoot
    :focus-on-change="false"
    class="flex h-9 items-center rounded-lg border bg-white shadow-sm focus-within:shadow-[0_0_0_2px] focus-within:shadow-stone-800 hover:bg-stone-50"
  >
    <NumberFieldDecrement class="p-2 disabled:opacity-20">
      <MinusIcon class="size-4" />
    </NumberFieldDecrement>
    <NumberFieldInput
      class="min-w-5 shrink grow bg-transparent p-1 text-center tabular-nums focus:outline-0"
    />
    <NumberFieldIncrement class="p-2 disabled:opacity-20">
      <PlusIcon class="size-4" />
    </NumberFieldIncrement>
  </NumberFieldRoot>
</template>
