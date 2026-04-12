<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { RouterView } from 'vue-router';
import { setupCabStateSync } from './cabs/state/setupCabStateSync';
import { setupBusLogger, setupDccInputBus } from './connections/ExConnection';
import { provideWebSerialConnection } from './connections/transports/provideWebSerialConnection';
import Sonner from './core/components/ui/sonner/Sonner.vue';
import DialogContainer from './core/dialogs/core/DialogContainer.vue';
import { provideDialog } from './core/dialogs/core/useDialog';

setupBusLogger();
setupDccInputBus();
setupCabStateSync();

const isAnyDialogOpen = ref(false);

const dialogContainer = useTemplateRef('dialogContainer');
provideDialog(dialogContainer);
provideWebSerialConnection();
</script>

<template>
  <div>
    <div class="relative z-0" :inert="isAnyDialogOpen">
      <RouterView />
    </div>
    <DialogContainer
      class="fixed inset-0 z-1"
      ref="dialogContainer"
      @update-is-any-dialog-open="isAnyDialogOpen = $event"
    />
    <Sonner richColors />
  </div>
</template>
