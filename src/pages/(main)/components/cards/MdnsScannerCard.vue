<script setup lang="ts">
import { useUdpMulticastTransport } from '@/connections/transports/udpMulticast/provideUdpMulticastTransport';
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
import { isMdnsScanSupported, startMdnsScan, stopMdnsScan, type MdnsServiceInfo } from '@/lib/tauriMdns';
import { RadarIcon, RadioIcon } from '@lucide/vue';
import { StorageSerializers, useStorage } from '@vueuse/core';
import { onUnmounted, ref } from 'vue';

const websocketAddress = defineModel<string>('websocketAddress', { required: true });

const {
  connect: connectUdpMulticast,
  disconnect: disconnectUdpMulticast,
  connected: isUdpMulticastConnected,
  connecting: isUdpMulticastConnecting,
} = useUdpMulticastTransport();

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
// device's own resolved address.
const listeningToServiceName = ref<string | null>(null);

interface UdpMulticastTarget {
  group: string;
  deviceAddress: string;
  port: number;
  serviceName: string;
}

// Persisted so the last-connected device can be reconnected on a later visit without having to
// rescan and rediscover it via mDNS again.
// The default value is `null`, so useStorage can't guess an object serializer from it (it
// falls back to stringifying via String(), i.e. the literal text "[object Object]") - it must
// be specified explicitly.
const lastUdpTarget = useStorage<UdpMulticastTarget | null>('lastUdpMulticastTarget', null, undefined, {
  serializer: StorageSerializers.object,
});

// If the transport is already connected (it's provided app-wide, so a remount of this card
// doesn't reset it) and it matches what we last persisted, reflect that in the UI immediately
// instead of showing every service as disconnected until the user interacts again.
if (isUdpMulticastConnected.value && lastUdpTarget.value) {
  listeningToServiceName.value = lastUdpTarget.value.serviceName;
}

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

async function connectUdpTo(target: UdpMulticastTarget): Promise<void> {
  if (listeningToServiceName.value) {
    await disconnectUdpMulticast();
    listeningToServiceName.value = null;
  }

  await connectUdpMulticast(target.group, target.deviceAddress, target.port);
  if (isUdpMulticastConnected.value) {
    listeningToServiceName.value = target.serviceName;
    lastUdpTarget.value = target;
  }
}

async function toggleUdpListen(service: MdnsServiceInfo): Promise<void> {
  if (listeningToServiceName.value === service.name) {
    await disconnectUdpMulticast();
    listeningToServiceName.value = null;
    return;
  }

  const target = multicastGroupFor(service);
  if (!target) return;

  await connectUdpTo({ ...target, serviceName: service.name });
}

async function toggleLastDevice(): Promise<void> {
  if (!lastUdpTarget.value) return;

  if (listeningToServiceName.value === lastUdpTarget.value.serviceName) {
    await disconnectUdpMulticast();
    listeningToServiceName.value = null;
    return;
  }

  await connectUdpTo(lastUdpTarget.value);
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
          <ItemDescription>{{ lastUdpTarget.serviceName }}</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button
            :variant="listeningToServiceName === lastUdpTarget.serviceName ? 'default' : 'outline'"
            size="sm"
            :disabled="isUdpMulticastConnecting"
            @click="toggleLastDevice"
          >
            <Spinner v-if="isUdpMulticastConnecting" />
            <RadioIcon v-else />
            {{ listeningToServiceName === lastUdpTarget.serviceName ? 'Disconnect' : 'Reconnect via UDP' }}
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
                :variant="listeningToServiceName === service.name ? 'default' : 'outline'"
                size="sm"
                :disabled="isUdpMulticastConnecting"
                @click="toggleUdpListen(service)"
              >
                <Spinner v-if="isUdpMulticastConnecting && listeningToServiceName !== service.name" />
                <RadioIcon v-else />
                {{ listeningToServiceName === service.name ? 'Disconnect' : 'Connect via UDP' }}
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
