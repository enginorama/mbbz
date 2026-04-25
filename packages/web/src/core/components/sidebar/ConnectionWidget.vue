<script setup lang="ts">
import { useConnection } from '@/connections/ExConnection';
import { useWebSocketTransport } from '@/connections/transports/websocket/useWebSocketTransport';
import { Avatar, AvatarFallback } from '@/core/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/core/components/ui/sidebar';
import { CableIcon, ChevronsUpDown, UnplugIcon } from 'lucide-vue-next';
import { computed } from 'vue';

const { isMobile } = useSidebar();

const { connected, connect, disconnect, connecting } = useConnection();

const { isConnected: websocketConnected, isConnecting: isWebSocketConnecting } =
  useWebSocketTransport();

const connectionInfo = computed(() => ({
  status:
    connected.value || websocketConnected.value
      ? 'connected'
      : connecting.value || isWebSocketConnecting.value
        ? 'connecting'
        : 'disconnected',
  type:
    [connected.value ? 'Serial' : null, websocketConnected.value ? 'WebSocket' : null]
      .filter(Boolean)
      .join(', ') || 'No connection',
}));
</script>
<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
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
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
