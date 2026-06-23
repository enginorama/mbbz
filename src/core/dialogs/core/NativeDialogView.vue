<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue';
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

onMounted(() => {
  dialogRef.value?.showModal();
});
</script>

<template>
  <dialog
    ref="dialogRef"
    class="m-auto flex overflow-hidden border-0 bg-transparent p-0"
    @mousedown="checkBackdropClick"
    @close="() => dialog.onClose(undefined)"
  >
    <component
      :is="props.dialog.component"
      v-bind="props.dialog.attrs"
      @close="dialog.onClose"
    ></component>
  </dialog>
</template>
