<script setup lang="ts">
import { useTemplateRef } from 'vue';
import type { DialogModel } from './DialogModel';

const props = defineProps<{
  dialog: DialogModel;
}>();

const dialogRef = useTemplateRef('dialogRef');

function checkBackdropClick(event: Event): void {
  if (event.target === dialogRef.value && event.currentTarget === dialogRef.value) {
    props.dialog.onClose(undefined);
    event.stopPropagation();
    event.preventDefault();
  }
}

const handleEscape = (event: KeyboardEvent): void => {
  if (event.key === 'Escape') {
    props.dialog.onClose(undefined);
  }
};
</script>

<template>
  <div
    ref="dialogRef"
    class="bg-primary-hover/50 absolute inset-0 backdrop-blur-[1px]"
    @click="checkBackdropClick"
    @keydown="handleEscape"
    tabindex="0"
  >
    <div
      :class="[
        'shadow-primary shadow-lg',
        'absolute top-1/2 left-1/2 max-h-[calc(100vh-4rem)] max-w-[calc(100vw-4rem)] -translate-1/2',
        'rounded-2xl bg-white',
        'flex flex-col overflow-hidden',
      ]"
    >
      <component :is="dialog.component" v-bind="dialog.attrs" @close="dialog.onClose"></component>
    </div>
  </div>
</template>
