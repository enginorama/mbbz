<script setup lang="ts">
import { RouterView } from 'vue-router';
import { useRosterSync } from './commandstation/roster/CsRosterLoader';
import DialogContainer from './core/dialogs/DialogContainer.vue';
import { provideDialogSystem } from './core/dialogs/useAppDialog';

provideDialogSystem();
useRosterSync();
</script>

<template>
  <RouterView class="relative z-0" />
  <DialogContainer class="absolute z-1" />
</template>
