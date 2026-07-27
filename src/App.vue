<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { RouterView } from 'vue-router';
import { setupCabStateSync } from './cabs/state/setupCabStateSync';
import { provideCommandStationStatusSync } from './commandstation/provideCommandStationStatusSync';
import { setupDccInputBus } from './connections/ExConnection';
import { provideTauriSerialTransport } from './connections/transports/serial/provideTauriSerialTransport';
import { provideWebSerialTransport } from './connections/transports/serial/provideWebSerialTransport';
import { provideUdpMulticastTransport } from './connections/transports/udpMulticast/provideUdpMulticastTransport';
import { provideWebSocketTransport } from './connections/transports/websocket/useWebSocketTransport';
import Sonner from './core/components/ui/sonner/Sonner.vue';
import DialogContainer from './core/dialogs/core/DialogContainer.vue';
import { provideDialog } from './core/dialogs/core/useDialog';

setupDccInputBus();
setupCabStateSync();
provideCommandStationStatusSync();

const isAnyDialogOpen = ref(false);

const dialogContainer = useTemplateRef('dialogContainer');
provideDialog(dialogContainer);
provideWebSerialTransport();
provideTauriSerialTransport();
provideWebSocketTransport();
provideUdpMulticastTransport();
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
