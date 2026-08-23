<script setup lang="ts">
import { useCommandStation } from '@/commandstation/useCommandStation';
import { useCommandStationStatusStore } from '@/commandstation/useCommandStationStatusStore';
import { useConnectionManager } from '@/connections/ConnectionManager';
import { useTransportStatusStore } from '@/connections/transports/useTransportStatusStore';
import Button from '@/core/components/ui/button/Button.vue';
import Card from '@/core/components/ui/card/Card.vue';
import CardContent from '@/core/components/ui/card/CardContent.vue';
import CardHeader from '@/core/components/ui/card/CardHeader.vue';
import CardTitle from '@/core/components/ui/card/CardTitle.vue';
import type { TrackMode } from '@/ex-native/parsers/parseTrackConfiguration';
import { CheckIcon, CloudAlertIcon } from '@lucide/vue';
import { computed } from 'vue';

const commandStationStatusStore = useCommandStationStatusStore();
const transportStatusStore = useTransportStatusStore();
const commandStation = useCommandStation();
const connectionManager = useConnectionManager();

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

function togglePower(track: string): void {
  const currentPower = commandStationStatusStore.trackPowers[track];
  const newPowerState = !(currentPower?.on ?? false);
  const command = newPowerState ? `1 ${track}` : `0 ${track}`;
  void connectionManager.send(`<${command}>`);
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
</script>

<template>
  <Card class="max-w-120">
    <CardHeader>
      <CardTitle>Command Station Info</CardTitle>
    </CardHeader>
    <CardContent>
      <ul class="mb-4">
        <li v-if="transportStatusStore.isConnected" class="mt-2 flex items-start gap-2">
          <CheckIcon class="mr-2 inline h-5 w-5 text-green-500" /> EX-CommandStation is connected.
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
          <Button variant="outline" class="mt-2" @click="togglePower(power.track)"> Toggle </Button>
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
          <Button @click="() => commandStation.requestPauseStatus()"> Request Pause Status </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
