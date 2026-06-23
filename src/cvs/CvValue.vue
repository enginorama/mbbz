<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  value: number;
}>();

const isValid = computed(() => {
  return props.value >= 0 && props.value <= 255;
});

const decimalString = computed(() => {
  return isValid.value ? props.value.toString() : '---';
});

const hexString = computed(() => {
  return isValid.value ? `0x${props.value.toString(16).toUpperCase().padStart(2, '0')}` : '---';
});

const binaryString = computed(() => {
  return isValid.value ? props.value.toString(2).padStart(8, '0') : '--------';
});
</script>

<template>
  <div>
    <div class="mb-2 flex w-full justify-center gap-8 text-4xl">
      <div class="font-bold">{{ decimalString }}</div>
      <div>{{ hexString }}</div>
    </div>
    <div class="text-center font-mono text-xl">{{ binaryString }}</div>
  </div>
</template>
