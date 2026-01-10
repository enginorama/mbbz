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
  ServerCogIcon,
  SplitIcon,
  TrainFrontIcon,
} from 'lucide-vue-next';
import { computed, markRaw, type FunctionalComponent } from 'vue';
import { RouterLink, type RouteLocationRaw } from 'vue-router';
import Separator from '../ui/separator/Separator.vue';
import SidebarFooter from '../ui/sidebar/SidebarFooter.vue';
import SidebarHeader from '../ui/sidebar/SidebarHeader.vue';
import SidebarRail from '../ui/sidebar/SidebarRail.vue';
import ConnectionWidget from './ConnectionWidget.vue';

interface NavItem {
  label: string;
  icon: FunctionalComponent;
  to: RouteLocationRaw;
}

const navItems = computed<NavItem[]>(() => {
  return [
    {
      label: 'sidebar.start',
      icon: TrainFrontIcon,
      to: { name: '/(main)/' },
    },
    {
      label: 'sidebar.throttle',
      icon: GaugeIcon,
      to: { name: '/(main)/throttle' },
    },
    {
      label: 'sidebar.cabs',
      icon: TrainFrontIcon,
      to: { name: '/(main)/cabs/' },
    },
    {
      label: 'sidebar.turnouts',
      icon: SplitIcon,
      to: { name: '/(main)/turnouts/' },
    },
    {
      label: 'sidebar.sensors',
      icon: GamepadDirectionalIcon,
      to: { name: '/(main)/sensors' },
    },
    {
      label: 'sidebar.cvs',
      icon: ServerCogIcon,
      to: { name: '/(main)/cvs' },
    },
  ];
});
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
          <SidebarMenu class="gap-3">
            <SidebarMenuItem v-for="navItem in navItems" :key="navItem.label">
              <SidebarMenuButton as-child size="lg">
                <RouterLink :to="navItem.to">
                  <div class="flex aspect-square size-8 items-center justify-center">
                    <component :is="navItem.icon" />
                  </div>
                  <span>{{ $t(navItem.label) }}</span>
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
