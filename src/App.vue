<script setup lang="ts">
import { ref } from 'vue';
import { RouterView } from 'vue-router';
import { setupCabStateSync } from './cabs/state/setupCabStateSync';
import { provideCommandStationStatusSync } from './commandstation/provideCommandStationStatusSync';
import { setupDccInputBus } from './connections/ExConnection';
import { provideTauriSerialTransport } from './connections/transports/serial/provideTauriSerialTransport';
import { provideWebSerialTransport } from './connections/transports/serial/provideWebSerialTransport';
import { provideUdpMulticastTransport } from './connections/transports/udpMulticast/provideUdpMulticastTransport';
import { provideWebSocketTransport } from './connections/transports/websocket/useWebSocketTransport';
import SheetStack from './core/components/AppSheet/SheetStack.vue';
import Sonner from './core/components/ui/sonner/Sonner.vue';

setupDccInputBus();
setupCabStateSync();
provideCommandStationStatusSync();

const isAnyDialogOpen = ref(false);

provideWebSerialTransport();
provideTauriSerialTransport();
provideWebSocketTransport();
provideUdpMulticastTransport();

import { onMounted } from 'vue';
import { provideAppSheet } from './core/components/AppSheet/useAppSheet.ts';

const { stack, remove } = provideAppSheet();

onMounted(() => {
  const ua = navigator.userAgent;
  const isFirefoxAndroid = /Android/i.test(ua) && /Firefox/i.test(ua);
  if (isFirefoxAndroid) {
    const versionString = ua.match(/Firefox\/(\d+)/)?.[1];
    const firefoxVersion = versionString ? parseInt(versionString, 10) : null;

    if (firefoxVersion && firefoxVersion >= 150) {
      // Firefox Android 150+ reports a bogus safe-area-inset-bottom
      document.documentElement.style.setProperty('--app-safe-bottom', '0px');
    }
  }
});
</script>

<template>
  <div>
    <div class="relative z-0" :inert="isAnyDialogOpen">
      <RouterView />
    </div>
    <SheetStack :stack="stack" :remove="remove" />
    <Sonner richColors />
  </div>
</template>
