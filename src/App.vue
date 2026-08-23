<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { RouterView } from 'vue-router';
import { setupCabStateSync } from './cabs/state/setupCabStateSync';
import { CommandStation } from './commandstation/CommandStation';
import { provideCommandStationStatusSync } from './commandstation/provideCommandStationStatusSync';
import { provideCommandStation } from './commandstation/useCommandStation';
import { provideConnectionManager } from './connections/ConnectionManager';
import { TauriSerialTransport } from './connections/transports/serial/TauriSerialTransport';
import { WebSerialTransport } from './connections/transports/serial/WebSerialTransport';
import { UdpMulticastTransport } from './connections/transports/udpMulticast/UdpMulticastTransport';
import { WebSocketTransport } from './connections/transports/websocket/WebSocketTransport';
import SheetStack from './core/components/AppSheet/SheetStack.vue';
import Sonner from './core/components/ui/sonner/Sonner.vue';

// Provide the orchestrator and the command-station client, then register the transport adapters.
// Transports are pure I/O adapters; the CommandStation decodes and dispatches DCC-EX packets over
// the connection's raw I/O surface.
const { manager: connection, io } = provideConnectionManager();
const commandStation = provideCommandStation(new CommandStation(io));

const stopCabStateSync = setupCabStateSync(commandStation);
const stopCommandStationStatusSync = provideCommandStationStatusSync(commandStation);

onUnmounted(() => {
  stopCabStateSync();
  stopCommandStationStatusSync();
});

connection.register(new WebSocketTransport());
connection.register(new WebSerialTransport());
connection.register(new TauriSerialTransport());
connection.register(new UdpMulticastTransport());
void connection.restore();

const isAnyDialogOpen = ref(false);

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
