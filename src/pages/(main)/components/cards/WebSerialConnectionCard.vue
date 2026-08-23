<script setup lang="ts">
import { useConnectionManager } from '@/connections/ConnectionManager';
import Button from '@/core/components/ui/button/Button.vue';
import Card from '@/core/components/ui/card/Card.vue';
import CardContent from '@/core/components/ui/card/CardContent.vue';
import CardHeader from '@/core/components/ui/card/CardHeader.vue';
import CardTitle from '@/core/components/ui/card/CardTitle.vue';
import Spinner from '@/core/components/ui/spinner/Spinner.vue';
import { CheckIcon, TriangleAlertIcon } from '@lucide/vue';

const connectionManager = useConnectionManager();
const webSerial = connectionManager.get('webSerial')!;

const connect = () => void connectionManager.connect('webSerial', { kind: 'webSerial' });
const disconnect = () => void connectionManager.disconnect('webSerial');
const connected = webSerial.connected;
const connecting = webSerial.connecting;
const isWebSerialSupported = webSerial.isSupported;
</script>

<template>
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
            <div class="text-primary/50">Please use a supported browser (like Chrome or Edge).</div>
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
</template>
