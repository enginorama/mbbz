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
import { GalleryVerticalEnd, HomeIcon } from 'lucide-vue-next';
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
          <SidebarMenuButton size="lg">
            <div
              class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
            >
              <GalleryVerticalEnd class="size-4" />
            </div>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold">Acme Inc</span>
              <span class="truncate text-xs">Enterprise</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
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
                  <HomeIcon />
                  <span>{{ $t('sidebar.throttle') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg">
                <RouterLink to="/cabs" class="flex items-center gap-2">
                  <HomeIcon />
                  <span>{{ $t('sidebar.cabs') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg">
                <RouterLink to="/turnouts" class="flex items-center gap-2">
                  <HomeIcon />
                  <span>{{ $t('sidebar.turnouts') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg">
                <RouterLink to="/turnouts" class="flex items-center gap-2">
                  <HomeIcon />
                  <span>{{ $t('sidebar.sensors') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg">
                <RouterLink to="/turnouts" class="flex items-center gap-2">
                  <HomeIcon />
                  <span>{{ $t('sidebar.maintenance') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>
      <ConnectionWidget :user="{ name: 'sd', email: '', avatar: '' }" />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
