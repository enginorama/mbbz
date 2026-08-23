<script setup lang="ts">
import { useConnectionManager } from '@/connections/ConnectionManager';
import type { SerialPortInfo } from '@/lib/getSerialPorts';
import { Avatar, AvatarFallback } from '@/core/components/ui/avatar';
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

const manager = useConnectionManager();

const webSerial = manager.get('webSerial');
const tauriSerial = manager.get('tauriSerial');
const websocket = manager.get('websocket');
const udp = manager.get('udpMulticast');

const webSerialConnected = webSerial.connected;
const webSerialConnecting = webSerial.connecting;
const tauriSerialConnected = tauriSerial.connected;
const tauriSerialConnecting = tauriSerial.connecting;
const websocketConnected = websocket.connected;
const websocketConnecting = websocket.connecting;
const udpConnected = udp.connected;
const udpConnecting = udp.connecting;

const tauriSerialPorts = ref<SerialPortInfo[]>([]);

async function refreshTauriSerialPorts() {
  if (!tauriSerial.isSupported) return;
  tauriSerialPorts.value = await tauriSerial.getAvailablePorts();
}

const transportLabel: Record<string, string> = {
  webSerial: 'Serial',
  tauriSerial: 'Native Serial',
  websocket: 'WebSocket',
  udpMulticast: 'UDP Multicast',
};

const connectionInfo = computed(() => ({
  status:
    webSerialConnected.value ||
    tauriSerialConnected.value ||
    websocketConnected.value ||
    udpConnected.value
      ? 'connected'
      : webSerialConnecting.value ||
          tauriSerialConnecting.value ||
          websocketConnecting.value ||
          udpConnecting.value
        ? 'connecting'
        : 'disconnected',
  type:
    [
      webSerialConnected.value ? 'Serial' : null,
      tauriSerialConnected.value ? 'Native Serial' : null,
      websocketConnected.value ? 'WebSocket' : null,
      udpConnected.value ? 'UDP Multicast' : null,
    ]
      .filter(Boolean)
      .join(', ') || 'No connection',
  active: manager.activeTransportId.value ? transportLabel[manager.activeTransportId.value] : null,
}));

function connectWebSerial() {
  void manager.connect('webSerial', { kind: 'webSerial' });
}

function connectTauriSerial(path?: string) {
  void manager.connect('tauriSerial', { kind: 'tauriSerial', path });
}

function disconnectWebSerial() {
  void manager.disconnect('webSerial');
}

function disconnectTauriSerial() {
  void manager.disconnect('tauriSerial');
}

function disconnectUdp() {
  void manager.disconnect('udpMulticast');
}

function isActiveTransport(id: string): boolean {
  return manager.activeTransportId.value === id;
}
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
                <CableIcon v-if="connectionInfo.status === 'connected'" />
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
                >{{
                  connectionInfo.active ? `Active: ${connectionInfo.active}` : connectionInfo.status
                }}</span
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
          <DropdownMenuGroup v-if="!webSerialConnected">
            <DropdownMenuItem as-child>
              <SidebarMenuButton @click="connectWebSerial" :disabled="webSerialConnecting">
                <CableIcon />
                {{ $t('globals.connect') }} Serial
                <span v-if="isActiveTransport('webSerial')" class="ml-auto text-xs text-green-500"
                  >Active</span
                >
              </SidebarMenuButton>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator v-if="webSerialConnected" />
          <DropdownMenuItem v-if="webSerialConnected" as-child>
            <SidebarMenuButton @click="disconnectWebSerial">
              <CableIcon />
              {{ $t('globals.disconnect') }} Serial
              <span v-if="isActiveTransport('webSerial')" class="ml-auto text-xs text-green-500"
                >Active</span
              >
            </SidebarMenuButton>
          </DropdownMenuItem>
          <template v-if="tauriSerial.isSupported">
            <DropdownMenuGroup v-if="!tauriSerialConnected">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger :disabled="tauriSerialConnecting">
                  <CableIcon />
                  {{ $t('globals.connect') }} Native Serial
                  <span
                    v-if="isActiveTransport('tauriSerial')"
                    class="ml-auto text-xs text-green-500"
                    >Active</span
                  >
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
                <span v-if="isActiveTransport('tauriSerial')" class="ml-auto text-xs text-green-500"
                  >Active</span
                >
              </SidebarMenuButton>
            </DropdownMenuItem>
          </template>
          <template v-if="udpConnected">
            <DropdownMenuSeparator />
            <DropdownMenuItem as-child>
              <SidebarMenuButton @click="disconnectUdp">
                <RadioIcon />
                {{ $t('globals.disconnect') }} UDP Multicast
                <span
                  v-if="isActiveTransport('udpMulticast')"
                  class="ml-auto text-xs text-green-500"
                  >Active</span
                >
              </SidebarMenuButton>
            </DropdownMenuItem>
          </template>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
