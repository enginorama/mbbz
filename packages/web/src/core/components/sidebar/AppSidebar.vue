<script setup lang="ts">
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/core/components/ui/sidebar';
import {
  GamepadDirectionalIcon,
  GaugeIcon,
  HomeIcon,
  MemoryStickIcon,
  SplitIcon,
  TrainFrontIcon,
} from 'lucide-vue-next';
import { markRaw } from 'vue';
import { RouterLink } from 'vue-router';
import Separator from '../ui/separator/Separator.vue';
import SidebarFooter from '../ui/sidebar/SidebarFooter.vue';
import SidebarHeader from '../ui/sidebar/SidebarHeader.vue';
import SidebarRail from '../ui/sidebar/SidebarRail.vue';
import ConnectionWidget from './ConnectionWidget.vue';
</script>

<template>
  <Sidebar variant="sidebar" collapsible="icon" side="left">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" :as="markRaw(RouterLink)" :to="{ name: '/(main)' }">
            <div
              class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
            >
              <TrainFrontIcon class="size-6"></TrainFrontIcon>
            </div>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="font-xl truncate text-2xl font-bold">mbbz</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    <Separator />
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg">
                <RouterLink :to="{ name: '/(main)' }" class="flex items-center gap-2">
                  <HomeIcon />
                  <span>{{ $t('sidebar.start') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg">
                <RouterLink :to="{ name: '/(main)/throttle' }" class="flex items-center gap-2">
                  <GaugeIcon />
                  <span>{{ $t('sidebar.throttle') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg">
                <RouterLink to="/cabs" class="flex items-center gap-2">
                  <TrainFrontIcon />
                  <span>{{ $t('sidebar.cabs') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg">
                <RouterLink to="/turnouts" class="flex items-center gap-2">
                  <SplitIcon />
                  <span>{{ $t('sidebar.turnouts') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg">
                <RouterLink to="/turnouts" class="flex items-center gap-2">
                  <GamepadDirectionalIcon />
                  <span>{{ $t('sidebar.sensors') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg">
                <RouterLink to="/turnouts" class="flex items-center gap-2">
                  <MemoryStickIcon />
                  <span>{{ $t('sidebar.maintenance') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>
      <ConnectionWidget />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
