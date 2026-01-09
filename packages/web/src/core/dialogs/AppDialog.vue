<script setup lang="ts">
import { useTemplateRef } from 'vue';
import Button from '../components/ui/button/Button.vue';

defineProps<{
  show: boolean;
  title: string;
  counter?: number;
}>();

const dialogRef = useTemplateRef<HTMLDialogElement>('dialogRef');

const emit = defineEmits<{
  (e: 'close', id: number): void;
}>();

defineExpose({
  async show() {
    dialogRef.value?.showModal();
  },
});
</script>

<template>
  <dialog ref="dialogRef" @close="emit('close', 42)">
    THIS IS DIALOG {{ title }}
    <Button variant="default" @click="dialogRef?.close()">CLOSE</Button>
  </dialog>
</template>
