<script setup lang="ts">
import { toValue } from 'vue';
import type { SheetConfiguration } from './useAppSheet';

const props = defineProps<{
  stack: Array<SheetConfiguration>;
  remove: (sheet: SheetConfiguration) => void;
}>();

function handleClosed(sheet: SheetConfiguration) {
  sheet.onClose();
  props.remove(sheet);
}
</script>

<template>
  <div class="SheetContainer">
    <component
      v-for="sheet in stack"
      :key="sheet.id"
      :is="sheet.component"
      v-bind="toValue(sheet.props)"
      @update:value="sheet.setValue($event)"
      @closed="handleClosed(sheet)"
    />
  </div>
</template>
