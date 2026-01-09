<script setup lang="ts">
import { RouterView } from 'vue-router';
import {
  provideWebSerialConnection,
  setupBusLogger,
  setupDccInputBus,
} from './connections/ExConnection';
import DialogContainer from './core/dialogs/DialogContainer.vue';
import { provideDialogSystem } from './core/dialogs/useAppDialog';

setupBusLogger();
setupDccInputBus();

provideDialogSystem();
provideWebSerialConnection();
</script>

<template>
  <RouterView class="relative z-0" />
  <DialogContainer class="absolute z-1" />
</template>
