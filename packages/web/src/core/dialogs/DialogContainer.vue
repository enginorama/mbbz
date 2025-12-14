<script setup lang="ts">
import DialogWrapper from './DialogWrapper.vue';
import { injectDialogSystem } from './useAppDialog';

const { shownDialogs } = injectDialogSystem();
</script>

<template>
  <div>
    <DialogWrapper
      v-for="dialog in shownDialogs"
      :key="dialog.id"
      :dialogInfo="dialog"
    ></DialogWrapper>
  </div>
</template>
