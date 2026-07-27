<script setup lang="ts">
import { useTauriSerialTransport } from '@/connections/transports/serial/provideTauriSerialTransport';
import { useWebSerialTransport } from '@/connections/transports/serial/provideWebSerialTransport';
import { useUdpMulticastTransport } from '@/connections/transports/udpMulticast/provideUdpMulticastTransport';
import { useWebSocketTransport } from '@/connections/transports/websocket/useWebSocketTransport';
import { Avatar, AvatarFallback } from '@/core/components/ui/avatar';
import type { SerialPortInfo } from '@/lib/getSerialPorts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/core/components/ui/sidebar';
import { CableIcon, ChevronsUpDown, RadioIcon, UnplugIcon } from '@lucide/vue';
import { computed, ref } from 'vue';

const { isMobile } = useSidebar();

const { connected, connect, disconnect, connecting } = useWebSerialTransport();

const {
  connected: tauriSerialConnected,
  connect: connectTauriSerial,
  disconnect: disconnectTauriSerial,
  connecting: connectingTauriSerial,
  isSupported: isTauriSerialSupported,
  getAvailablePorts,
} = useTauriSerialTransport();

const tauriSerialPorts = ref<SerialPortInfo[]>([]);

async function refreshTauriSerialPorts() {
  if (!isTauriSerialSupported) return;
  tauriSerialPorts.value = await getAvailablePorts();
}

const { isConnected: websocketConnected, isConnecting: isWebSocketConnecting } =
  useWebSocketTransport();

const {
  connected: udpMulticastConnected,
  disconnect: disconnectUdpMulticast,
  connecting: connectingUdpMulticast,
} = useUdpMulticastTransport();

const connectionInfo = computed(() => ({
  status:
    connected.value || tauriSerialConnected.value || websocketConnected.value || udpMulticastConnected.value
      ? 'connected'
      : connecting.value ||
          connectingTauriSerial.value ||
          isWebSocketConnecting.value ||
          connectingUdpMulticast.value
        ? 'connecting'
        : 'disconnected',
  type:
    [
      connected.value ? 'Serial' : null,
      tauriSerialConnected.value ? 'Native Serial' : null,
      websocketConnected.value ? 'WebSocket' : null,
      udpMulticastConnected.value ? 'UDP Multicast' : null,
    ]
      .filter(Boolean)
      .join(', ') || 'No connection',
}));
</script>
<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu @update:open="(open) => open && refreshTauriSerialPorts()">
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar class="h-8 w-8 rounded-lg">
              <AvatarFallback class="rounded-lg">
                <CableIcon v-if="connected" />
                <UnplugIcon v-else />
              </AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">{{ connectionInfo.type }}</span>
              <span
                class="truncate text-xs"
                :class="{
                  'text-green-500': connectionInfo.status === 'connected',
                  'text-yellow-500': connectionInfo.status === 'connecting',
                  'text-destructive': connectionInfo.status === 'disconnected',
                }"
                >{{ connectionInfo.status }}</span
              >
            </div>
            <ChevronsUpDown class="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-[--reka-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          :side="isMobile ? 'bottom' : 'right'"
          align="end"
          :side-offset="4"
        >
          <DropdownMenuGroup v-if="!connected">
            <DropdownMenuItem as-child>
              <SidebarMenuButton @click="connect" :disabled="connecting">
                <CableIcon />
                {{ $t('globals.connect') }} Serial
              </SidebarMenuButton>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator v-if="connected" />
          <DropdownMenuItem v-if="connected" as-child>
            <SidebarMenuButton @click="disconnect">
              <CableIcon />
              {{ $t('globals.disconnect') }} Serial
            </SidebarMenuButton>
          </DropdownMenuItem>
          <template v-if="isTauriSerialSupported">
            <DropdownMenuGroup v-if="!tauriSerialConnected">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger :disabled="connectingTauriSerial">
                  <CableIcon />
                  {{ $t('globals.connect') }} Native Serial
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem v-if="tauriSerialPorts.length === 0" disabled>
                    No ports found
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-for="port in tauriSerialPorts"
                    :key="port.name"
                    @click="connectTauriSerial(port.name)"
                  >
                    {{ port.name }}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator v-if="tauriSerialConnected" />
            <DropdownMenuItem v-if="tauriSerialConnected" as-child>
              <SidebarMenuButton @click="disconnectTauriSerial">
                <CableIcon />
                {{ $t('globals.disconnect') }} Native Serial
              </SidebarMenuButton>
            </DropdownMenuItem>
          </template>
          <template v-if="udpMulticastConnected">
            <DropdownMenuSeparator />
            <DropdownMenuItem as-child>
              <SidebarMenuButton @click="disconnectUdpMulticast">
                <RadioIcon />
                {{ $t('globals.disconnect') }} UDP Multicast
              </SidebarMenuButton>
            </DropdownMenuItem>
          </template>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
