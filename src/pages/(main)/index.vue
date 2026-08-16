<script setup lang="ts">
import PageLayout from '@/core/components/PageLayout.vue';
import { useStorage } from '@vueuse/core';
import CommandStationInfoCard from './components/cards/CommandStationInfoCard.vue';
import MdnsScannerCard from './components/cards/MdnsScannerCard.vue';
import WebSerialConnectionCard from './components/cards/WebSerialConnectionCard.vue';
import WebSocketConnectionCard from './components/cards/WebSocketConnectionCard.vue';

const websocketAddress = useStorage('websocketAddress', 'ws://dccex.local:2560');
</script>

<template>
  <PageLayout title="Welcome to mbbz" subtitle="Manage and control your DCC-EX layout">
    <div class="flex flex-col gap-8">
      <WebSerialConnectionCard />
      <WebSocketConnectionCard v-model:websocket-address="websocketAddress" />
      <MdnsScannerCard v-model:websocket-address="websocketAddress" />
      <CommandStationInfoCard />
    </div>
  </PageLayout>
</template>
