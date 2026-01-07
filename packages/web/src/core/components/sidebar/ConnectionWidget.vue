<script setup lang="ts">
import { rawInputBus, rawOutputBus, useDccInputBus } from '@/connections/connections';
import { useWebSerial } from '@/connections/useWebSerial';
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
import { parseDccExString } from '@/protocols/DccEx';
import { useEventBus } from '@vueuse/core';
import { CableIcon, ChevronsUpDown, LogsIcon, SettingsIcon, UnplugIcon } from 'lucide-vue-next';
import { computed } from 'vue';
import { toast } from 'vue-sonner';

const { isMobile } = useSidebar();

const bus = useEventBus(rawInputBus);
const dccInputBus = useDccInputBus();

const { open, close, connected, writeToStream, getPorts } = useWebSerial((msg) => {
  bus.emit(msg);
  const packets = parseDccExString(msg);
  packets.forEach((packet) => {
    dccInputBus.emit(packet);
  });
  console.log(msg);
});

const outputBus = useEventBus<string>(rawOutputBus);
outputBus.on((msg) => {
  if (connected.value) {
    writeToStream(msg);
  }
});

async function tryToOpenConnection() {
  try {
    const ports = await getPorts();
    const firstPort = ports[0];
    if (firstPort && ports.length > 0) {
      await open({ port: firstPort });
      return;
    }
    await open();
  } catch (e) {
    toast.error('Failed to open port');
    console.error(e);
  }
}

const connection = computed(() => ({
  status: connected.value ? 'connected' : 'disconnected',
  protocol: 'dcc-ex',
  type: 'Serial',
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
              <span class="truncate font-medium">{{ connection.type }}</span>
              <span
                class="truncate text-xs"
                :class="{
                  'text-green-500': connection.status === 'connected',
                  'text-destructive': connection.status === 'disconnected',
                }"
                >{{ connection.status }}</span
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
              <SidebarMenuButton @click="tryToOpenConnection">
                <CableIcon />
                Connect
              </SidebarMenuButton>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem as-child>
              <RouterLink :to="{ name: '/(main)/logs' }">
                <LogsIcon />
                Logs
              </RouterLink>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <SettingsIcon />
              Config
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator v-if="connected" />
          <DropdownMenuItem v-if="connected" as-child>
            <SidebarMenuButton @click="close">
              <CableIcon />
              Disconnect
            </SidebarMenuButton>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
