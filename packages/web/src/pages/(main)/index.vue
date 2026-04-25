<script setup lang="ts">
import { useCommandStationStatusStore } from '@/commandstation/useCommandStationStatusStore';
import { useConnection } from '@/connections/ExConnection';
import { ExWebSerial } from '@/connections/transports/ExWebSerial';
import { useTransportStatusStore } from '@/connections/transports/useTransportStatusStore';
import { useWebSocketTransport } from '@/connections/transports/websocket/useWebSocketTransport';
import PageLayout from '@/core/components/PageLayout.vue';
import Button from '@/core/components/ui/button/Button.vue';
import Card from '@/core/components/ui/card/Card.vue';
import CardContent from '@/core/components/ui/card/CardContent.vue';
import CardHeader from '@/core/components/ui/card/CardHeader.vue';
import CardTitle from '@/core/components/ui/card/CardTitle.vue';
import Input from '@/core/components/ui/input/Input.vue';
import Spinner from '@/core/components/ui/spinner/Spinner.vue';
import { useStorage } from '@vueuse/core';
import { CheckIcon, CloudAlertIcon, TriangleAlertIcon } from 'lucide-vue-next';

const { connect, connected, connecting, disconnect } = useConnection();
const isWebSerialSupported = ExWebSerial.isSupported;
const commandStationStatusStore = useCommandStationStatusStore();
const transportStatusStore = useTransportStatusStore();

const websocketAddress = useStorage('websocketAddress', 'ws://dccex.local:2560');

const {
  connect: connectWebSocket,
  disconnect: disconnectWebSocket,
  isConnected: isWebSocketConnected,
  isConnecting: isWebSocketConnecting,
} = useWebSocketTransport();

const connectWebSocketHandler = () => {
  connectWebSocket(websocketAddress.value);
};
</script>

<template>
  <PageLayout title="Welcome to mbbz" subtitle="Manage and control your DCC-EX layout">
    <div class="flex flex-col gap-8">
      <Card class="max-w-120">
        <CardHeader>
          <CardTitle>Connect your EX-CommandStation</CardTitle>
        </CardHeader>
        <CardContent>
          <ul>
            <li v-if="!isWebSerialSupported" class="mt-2 flex items-start gap-2 text-red-500">
              <TriangleAlertIcon />
              <div>
                <div>Web Serial API is not available.</div>
                <div class="text-primary/50">
                  Please use a supported browser (like Chrome or Edge).
                </div>
              </div>
            </li>
            <template v-if="isWebSerialSupported">
              <li class="mt-2 flex items-start gap-2">
                <CheckIcon class="text-green-500" /> Web Serial API is available.
              </li>
            </template>
          </ul>
          <Button
            v-if="!connected"
            class="mt-6"
            @click="connect"
            :disabled="!isWebSerialSupported || connecting"
          >
            <Spinner v-if="connecting" />
            Click here to connect with Web Serial
          </Button>
          <Button
            v-if="connected"
            variant="outline"
            class="mt-6"
            @click="disconnect"
            :disabled="!isWebSerialSupported || connecting"
          >
            Disconnect
          </Button>
        </CardContent>
      </Card>
      <Card class="max-w-120">
        <CardHeader>
          <CardTitle>WebSocket Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            class="mb-4"
            v-model="websocketAddress"
            :disabled="isWebSocketConnecting || isWebSocketConnected"
          />
          <Button
            @click="connectWebSocketHandler"
            v-if="!isWebSocketConnected"
            :disabled="isWebSocketConnecting"
          >
            Connect to WebSocket Server {{ isWebSocketConnecting }}
          </Button>
          <Button @click="disconnectWebSocket" v-if="isWebSocketConnected" variant="outline">
            Disconnect from WebSocket Server
          </Button>
        </CardContent>
      </Card>
      <Card class="max-w-120">
        <CardHeader>
          <CardTitle>Command Station Info</CardTitle>
        </CardHeader>
        <CardContent>
          <ul class="mb-4">
            <li v-if="transportStatusStore.isConnected" class="mt-2 flex items-start gap-2">
              <CheckIcon class="mr-2 inline h-5 w-5 text-green-500" /> EX-CommandStation is
              connected.
            </li>
            <li v-else class="mt-2 flex items-start gap-2 text-yellow-500">
              <CloudAlertIcon /> EX-CommandStation is not connected.
            </li>
          </ul>
          <ul>
            <li v-if="commandStationStatusStore.info">
              <div>Version: {{ commandStationStatusStore.info.version }}</div>
              <div>Board Type: {{ commandStationStatusStore.info.boardType }}</div>
              <div>Motor Shield: {{ commandStationStatusStore.info.motorShield }}</div>
              <div>Build Number: {{ commandStationStatusStore.info.buildNumber }}</div>
            </li>
            <li v-else class="text-gray-500">No command station info available.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  </PageLayout>
</template>
