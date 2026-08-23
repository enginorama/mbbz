<script setup lang="ts">
import { useConnectionManager } from '@/connections/ConnectionManager';
import { UdpMulticastTransport } from '@/connections/transports/udpMulticast/UdpMulticastTransport';
import Button from '@/core/components/ui/button/Button.vue';
import Card from '@/core/components/ui/card/Card.vue';
import CardContent from '@/core/components/ui/card/CardContent.vue';
import CardHeader from '@/core/components/ui/card/CardHeader.vue';
import CardTitle from '@/core/components/ui/card/CardTitle.vue';
import Item from '@/core/components/ui/item/Item.vue';
import ItemActions from '@/core/components/ui/item/ItemActions.vue';
import ItemContent from '@/core/components/ui/item/ItemContent.vue';
import ItemDescription from '@/core/components/ui/item/ItemDescription.vue';
import ItemTitle from '@/core/components/ui/item/ItemTitle.vue';
import Spinner from '@/core/components/ui/spinner/Spinner.vue';
import {
  isMdnsScanSupported,
  startMdnsScan,
  stopMdnsScan,
  type MdnsServiceInfo,
} from '@/lib/tauriMdns';
import { RadarIcon, RadioIcon } from '@lucide/vue';
import { computed, onUnmounted, ref } from 'vue';

const websocketAddress = defineModel<string>('websocketAddress', { required: true });

const connectionManager = useConnectionManager();
const udp = connectionManager.get('udpMulticast')! as UdpMulticastTransport;
const isUdpMulticastConnected = udp.connected;
const isUdpMulticastConnecting = udp.connecting;
const lastUdpTarget = udp.lastTarget;

async function connectUdpMulticast(group: string, deviceAddress: string, port: number, label: string) {
  await connectionManager.connect('udpMulticast', {
    kind: 'udpMulticast',
    group,
    deviceAddress,
    port,
    label,
  });
}

function disconnectUdpMulticast() {
  return connectionManager.disconnect('udpMulticast');
}

const mdnsServices = ref<MdnsServiceInfo[]>([]);
const isMdnsScanning = ref(false);

async function startScan(): Promise<void> {
  mdnsServices.value = [];
  const started = await startMdnsScan((service) => {
    const index = mdnsServices.value.findIndex(
      (s) => s.serviceType === service.serviceType && s.name === service.name,
    );
    if (index >= 0) mdnsServices.value[index] = service;
    else mdnsServices.value.push(service);
  });
  isMdnsScanning.value = started;
}

async function stopScan(): Promise<void> {
  await stopMdnsScan();
  isMdnsScanning.value = false;
}

function useServiceForWebSocket(service: MdnsServiceInfo): void {
  const host = service.addresses[0] ?? service.hostname;
  websocketAddress.value = `ws://${host}:${service.port}`;
}

// DCC-EX command stations advertise a companion UDP multicast broadcast channel (rather than
// relying on repeat mDNS queries, which some ESP32 mDNS responders handle unreliably once
// already running) carrying the same live status protocol as the serial/WebSocket transports.
// Broadcasts arrive via the multicast group, but commands are sent back unicast directly to the
// device's own resolved address. The transport itself tracks and persists the last-connected
// target (see provideUdpMulticastTransport), so this component just reads it.
const connectedServiceName = computed(() =>
  isUdpMulticastConnected.value ? (lastUdpTarget.value?.label ?? null) : null,
);

function multicastGroupFor(
  service: MdnsServiceInfo,
): { group: string; deviceAddress: string; port: number } | null {
  const group = service.txt.group;
  const deviceAddress = service.addresses[0];
  const port = Number(service.txt.port);
  if (service.txt.multicast !== 'true' || !group || !deviceAddress || !Number.isFinite(port)) {
    return null;
  }
  return { group, deviceAddress, port };
}

async function toggleUdpListen(service: MdnsServiceInfo): Promise<void> {
  if (connectedServiceName.value === service.name) {
    await disconnectUdpMulticast();
    return;
  }

  const target = multicastGroupFor(service);
  if (!target) return;

  if (isUdpMulticastConnected.value) {
    await disconnectUdpMulticast();
  }
  await connectUdpMulticast(target.group, target.deviceAddress, target.port, service.name);
}

async function toggleLastDevice(): Promise<void> {
  if (!lastUdpTarget.value) return;

  if (connectedServiceName.value === lastUdpTarget.value.label) {
    await disconnectUdpMulticast();
    return;
  }

  if (isUdpMulticastConnected.value) {
    await disconnectUdpMulticast();
  }
  const { group, deviceAddress, port, label } = lastUdpTarget.value;
  await connectUdpMulticast(group, deviceAddress, port, label);
}

onUnmounted(() => {
  if (isMdnsScanning.value) void stopMdnsScan();
});
</script>

<template>
  <Card class="max-w-120" v-if="isMdnsScanSupported">
    <CardHeader>
      <CardTitle>mDNS Device Scanner</CardTitle>
    </CardHeader>
    <CardContent>
      <Item v-if="lastUdpTarget" variant="outline" class="mb-4">
        <ItemContent>
          <ItemTitle>Last connected device</ItemTitle>
          <ItemDescription>{{ lastUdpTarget.label }}</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button
            :variant="connectedServiceName === lastUdpTarget.label ? 'default' : 'outline'"
            size="sm"
            :disabled="isUdpMulticastConnecting"
            @click="toggleLastDevice"
          >
            <Spinner v-if="isUdpMulticastConnecting" />
            <RadioIcon v-else />
            {{ connectedServiceName === lastUdpTarget.label ? 'Disconnect' : 'Reconnect via UDP' }}
          </Button>
        </ItemActions>
      </Item>
      <Button v-if="!isMdnsScanning" @click="startScan">
        <RadarIcon />
        Scan for devices
      </Button>
      <Button v-else variant="outline" @click="stopScan">
        <Spinner />
        Stop scanning
      </Button>
      <ul class="mt-4 flex flex-col gap-2">
        <li v-for="service in mdnsServices" :key="`${service.serviceType}|${service.name}`">
          <Item variant="outline">
            <ItemContent>
              <ItemTitle>{{ service.name }}</ItemTitle>
              <ItemDescription>
                {{ service.serviceType }} &middot; {{ service.hostname }}
                <template v-if="service.addresses.length"
                  >({{ service.addresses.join(', ') }})</template
                >:{{ service.port }}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button
                v-if="multicastGroupFor(service)"
                :variant="connectedServiceName === service.name ? 'default' : 'outline'"
                size="sm"
                :disabled="isUdpMulticastConnecting"
                @click="toggleUdpListen(service)"
              >
                <Spinner v-if="isUdpMulticastConnecting && connectedServiceName !== service.name" />
                <RadioIcon v-else />
                {{ connectedServiceName === service.name ? 'Disconnect' : 'Connect via UDP' }}
              </Button>
              <Button variant="outline" size="sm" @click="useServiceForWebSocket(service)">
                Use for WebSocket
              </Button>
            </ItemActions>
          </Item>
        </li>
        <li v-if="isMdnsScanning && mdnsServices.length === 0" class="text-primary/50 mt-2">
          Searching for devices...
        </li>
      </ul>
    </CardContent>
  </Card>
</template>
