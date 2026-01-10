<script setup lang="ts">
import { useConnection } from '@/connections/ExConnection';
import { ExWebSerial } from '@/connections/transports/ExWebSerial';
import PageTitle from '@/core/components/PageTitle.vue';
import Button from '@/core/components/ui/button/Button.vue';
import Card from '@/core/components/ui/card/Card.vue';
import CardContent from '@/core/components/ui/card/CardContent.vue';
import CardHeader from '@/core/components/ui/card/CardHeader.vue';
import CardTitle from '@/core/components/ui/card/CardTitle.vue';
import Spinner from '@/core/components/ui/spinner/Spinner.vue';
import { CheckIcon, CloudAlertIcon, TriangleAlertIcon } from 'lucide-vue-next';

const { connected, connect, connecting } = useConnection();
const isWebSerialSupported = ExWebSerial.isSupported;
</script>

<template>
  <div>
    <PageTitle title="Welcome to mbbz" subtitle="Manage and control your DCC-EX layout" />
    <div>
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
              <li v-if="connected" class="mt-2 flex items-start gap-2">
                <CheckIcon class="mr-2 inline h-5 w-5 text-green-500" /> EX-CommandStation is
                connected.
              </li>
              <li v-if="!connected" class="mt-2 flex items-start gap-2 text-yellow-500">
                <CloudAlertIcon /> EX-CommandStation is not connected.
              </li>
            </template>
          </ul>
          <Button class="mt-6" @click="connect" :disabled="!isWebSerialSupported || connecting">
            <Spinner v-if="connecting" />
            Click here to connect with Web Serial
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
