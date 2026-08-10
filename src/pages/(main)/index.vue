<script setup lang="ts">
import { useCommandStation } from '@/commandstation/useCommandStation';
import { useCommandStationStatusStore } from '@/commandstation/useCommandStationStatusStore';
import { useExStationOutputBus } from '@/connections/ExEventBus';
import { ExWebSerial } from '@/connections/transports/serial/ExWebSerial';
import { useWebSerialTransport } from '@/connections/transports/serial/provideWebSerialTransport';
import { useTransportStatusStore } from '@/connections/transports/useTransportStatusStore';
import { useWebSocketTransport } from '@/connections/transports/websocket/useWebSocketTransport';
import AddSensorSheet from '@/core/components/AppSheet/AddSensorSheet.vue';
import AppDialog from '@/core/components/AppSheet/AppDialog.vue';
import AppDrawer from '@/core/components/AppSheet/AppDrawer.vue';
import AppSheet from '@/core/components/AppSheet/AppSheet.vue';
import { useAppSheet } from '@/core/components/AppSheet/useAppSheet.ts';
import PageLayout from '@/core/components/PageLayout.vue';
import Button from '@/core/components/ui/button/Button.vue';
import Card from '@/core/components/ui/card/Card.vue';
import CardContent from '@/core/components/ui/card/CardContent.vue';
import CardHeader from '@/core/components/ui/card/CardHeader.vue';
import CardTitle from '@/core/components/ui/card/CardTitle.vue';
import Input from '@/core/components/ui/input/Input.vue';
import Item from '@/core/components/ui/item/Item.vue';
import ItemContent from '@/core/components/ui/item/ItemContent.vue';
import ItemTitle from '@/core/components/ui/item/ItemTitle.vue';
import Spinner from '@/core/components/ui/spinner/Spinner.vue';
import type { TrackMode } from '@/ex-native/parsers/parseTrackConfiguration';
import { CheckIcon, CloudAlertIcon, TriangleAlertIcon } from '@lucide/vue';
import { useStorage } from '@vueuse/core';
import { DialogClose } from 'reka-ui';
import { computed, ref } from 'vue';
import MdnsScannerCard from './components/cards/MdnsScannerCard.vue';

const { connect, connected, connecting, disconnect } = useWebSerialTransport();
const isWebSerialSupported = ExWebSerial.isSupported;
const commandStationStatusStore = useCommandStationStatusStore();
const transportStatusStore = useTransportStatusStore();
const outputBus = useExStationOutputBus();
const commandStation = useCommandStation();

const websocketAddress = useStorage('websocketAddress', 'ws://dccex.local:2560');

const showDrawer = ref(false);
const showDialog = ref(false);
const powerInfo = computed<Array<{ track: string; mode?: TrackMode; on?: boolean }>>(() => {
  const trackNames = [
    ...new Set([
      ...Object.keys(commandStationStatusStore.trackPowers),
      ...Object.keys(commandStationStatusStore.trackConfigurations),
    ]).values(),
  ].sort();
  return trackNames.map((track) => {
    const power = commandStationStatusStore.trackPowers[track];
    const config = commandStationStatusStore.trackConfigurations[track];
    return {
      track,
      mode: config?.mode,
      on: power?.on,
    };
  });
});

const {
  connect: connectWebSocket,
  disconnect: disconnectWebSocket,
  isConnected: isWebSocketConnected,
  isConnecting: isWebSocketConnecting,
} = useWebSocketTransport();

const connectWebSocketHandler = () => {
  connectWebSocket(websocketAddress.value);
};

function togglePower(track: string): void {
  const currentPower = commandStationStatusStore.trackPowers[track];
  const newPowerState = !(currentPower?.on ?? false);
  const command = newPowerState ? `1 ${track}` : `0 ${track}`;
  outputBus.emit(`<${command}>`);
}

function emergencyStop(): void {
  commandStation.sendEmergencyStop();
}

function pause(): void {
  commandStation.sendPauseCabs();
}

function resume(): void {
  commandStation.sendResumeCabs();
}

function reload(): void {
  location.reload();
}

const { show } = useAppSheet();

async function showTest() {
  const value = await show(AddSensorSheet, {});
  console.log('showTest value:', value);
}
</script>

<template>
  <PageLayout title="Welcome to mbbz" subtitle="Manage and control your DCC-EX layout">
    <div class="flex flex-col gap-8">
      <Button @click="showTest">Show Add Sensor Sheet CODE</Button>
      <AddSensorSheet v-model:open="showDialog"></AddSensorSheet>
      <AppSheet title="Sheet Header" description="This is the content of the sheet.">
        <template #trigger>
          <Button>Open Sheet</Button>
        </template>
        <template #default="{ close }">
          HAHAAAAAAAAAAAAAAAA!!
          <Button @click="close">CLOSE</Button>
        </template>
      </AppSheet>

      <!-- <Button @click="showDrawer = !showDrawer">Toggle Drawer</Button> -->
      <Button @click="showDialog = !showDialog">Toggle Dialog</Button>
      <AppDialog :dismissible="false">
        <template #trigger>
          <Button>Open Dialog</Button>
        </template>
        HAHAAAAAAAAAAAAAAAA!!
        <DialogClose> CLOSE </DialogClose>
      </AppDialog>
      <Card class="max-w-120">
        <CardHeader>
          <CardTitle>Connect your EX-CommandStation</CardTitle>
        </CardHeader>
        <Button @click="reload">Reload</Button>
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
            Connect to WebSocket Server
          </Button>
          <Button @click="disconnectWebSocket" v-if="isWebSocketConnected" variant="outline">
            Disconnect from WebSocket Server
          </Button>
          <Item>
            <ItemContent>
              <ItemTitle><TriangleAlertIcon />Note</ItemTitle>
              <div>
                If you access this page online, you will most likely not be able to connect to your
                local command station because of browser security restrictions.
              </div>
              <div>Right now, this is only for local testing.</div>
            </ItemContent>
          </Item>
        </CardContent>
      </Card>
      <MdnsScannerCard v-model:websocket-address="websocketAddress" />
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
              <div class="font-bold">Version: {{ commandStationStatusStore.info.version }}</div>
              <div>Board Type: {{ commandStationStatusStore.info.boardType }}</div>
              <div>Motor Shield: {{ commandStationStatusStore.info.motorShield }}</div>
              <div>Build Number: {{ commandStationStatusStore.info.buildNumber }}</div>
              <div v-if="commandStationStatusStore.numMaxSupportedCabs != null">
                Max Supported Cabs: {{ commandStationStatusStore.numMaxSupportedCabs }}
              </div>
            </li>
            <li v-else class="text-gray-500">No command station info available.</li>
          </ul>
          <ul class="mt-4 flex gap-8">
            <li v-for="power in powerInfo" :key="power.track">
              <div class="font-bold">Track: {{ power.track }}</div>
              <div>Mode: {{ power.mode ?? 'unknown' }}</div>
              <div>Power: {{ power.on === undefined ? 'unknown' : power.on ? 'on' : 'off' }}</div>
              <Button variant="outline" class="mt-2" @click="togglePower(power.track)">
                Toggle
              </Button>
            </li>
          </ul>
          <div v-if="transportStatusStore.isConnected" class="mt-4 flex flex-col items-start gap-2">
            <div>
              <Button @click="emergencyStop">E-Stop</Button>
            </div>
            <div class="flex items-center gap-2" v-if="commandStationStatusStore.isPaused != null">
              <Button @click="pause" :disabled="commandStationStatusStore.isPaused === true">
                Pause
              </Button>
              <Button @click="resume" :disabled="commandStationStatusStore.isPaused === false">
                Resume
              </Button>
            </div>
            <div v-else>
              <Button @click="() => commandStation.requestPauseStatus()">
                Request Pause Status
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    <AppDrawer
      v-model:open="showDrawer"
      title="Drawer Header"
      description="This is the content of the drawer."
    >
      <div>Hallo!</div>
    </AppDrawer>
    <!-- <AppDialog v-model:open="showDialog"> DIALOG!!!!! </AppDialog> -->
  </PageLayout>
</template>
