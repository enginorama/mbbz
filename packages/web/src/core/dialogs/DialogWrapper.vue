<script setup lang="ts">
import { onMounted, toValue, useTemplateRef } from 'vue';
import { injectDialogSystem, type DialogConstructor, type DialogInfo } from './useAppDialog';

const props = defineProps<{
  dialogInfo: DialogInfo;
}>();

const dialogSystem = injectDialogSystem();
const dialogRef = useTemplateRef<InstanceType<DialogConstructor>>('dialogRef');

function cleanup($event: unknown) {
  props.dialogInfo.resolve($event);
  dialogSystem.closeDialog(props.dialogInfo.id);
}

onMounted(() => {
  dialogRef.value?.show();
});
</script>

<template>
  <component
    :is="props.dialogInfo.component"
    v-bind="toValue(props.dialogInfo.props)"
    ref="dialogRef"
    @close="cleanup"
  />
</template>
