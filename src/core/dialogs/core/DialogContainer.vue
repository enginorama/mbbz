<script setup lang="ts">
import { type Component, shallowRef, watch } from 'vue';
import type { ComponentProps } from 'vue-component-type-helpers';
import type { DialogModel } from './DialogModel';
import NativeDialogView from './NativeDialogView.vue';
import type { DialogComponentReturnValue } from './useDialog';

const emit = defineEmits<{
  updateIsAnyDialogOpen: [boolean];
}>();

let nextId = 1;
const dialogs = shallowRef<DialogModel[]>([]);

watch(dialogs, () => emit('updateIsAnyDialogOpen', !!dialogs.value.length), { immediate: true });

async function show<T extends Component>(
  component: T,
  attrs: ComponentProps<T>,
): Promise<DialogComponentReturnValue<T> | undefined> {
  const id = nextId++;

  const result = await new Promise<DialogComponentReturnValue<T> | undefined>((resolve) => {
    dialogs.value = [...dialogs.value, { id, component, attrs, onClose: resolve }];
  });

  destroyDialog(id);

  return result;
}

function destroyDialog(id: number): void {
  dialogs.value = dialogs.value.filter((t) => t.id !== id);
}

defineExpose({
  show,
});
</script>

<template>
  <div :class="[!dialogs.length && 'pointer-events-none', $attrs.class]">
    <NativeDialogView
      v-for="(dialog, $index) in dialogs"
      :key="dialog.id"
      :dialog="dialog"
      :inert="$index < dialogs.length - 1"
    ></NativeDialogView>
  </div>
</template>
