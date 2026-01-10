<script setup lang="ts">
import { useConnection } from '@/connections/ExConnection';
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
import { CableIcon, ChevronsUpDown, LogsIcon, SettingsIcon, UnplugIcon } from 'lucide-vue-next';
import { computed } from 'vue';

const { isMobile } = useSidebar();

const { connected, connect, disconnect, connecting } = useConnection();

const connectionInfo = computed(() => ({
  status: connected.value ? 'connected' : connecting.value ? 'connecting' : 'disconnected',
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
          <DropdownMenuSeparator v-if="!connected" />
          <DropdownMenuItem v-if="connected" as-child>
            <SidebarMenuButton @click="disconnect">
              <CableIcon />
              Disconnect
            </SidebarMenuButton>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
