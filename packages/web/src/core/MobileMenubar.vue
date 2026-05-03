<script setup lang="ts">
import {
  GamepadDirectionalIcon,
  GaugeIcon,
  HomeIcon,
  SplitIcon,
  TrainFrontIcon,
} from 'lucide-vue-next';
import { computed, type Component } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

const navItems = computed<
  Array<{
    label: string;
    icon: Component;
    to: RouteLocationRaw;
    exact?: boolean;
  }>
>(() => {
  return [
    {
      label: 'sidebar.start',
      icon: HomeIcon,
      to: { name: '/(main)/' },
      exact: true,
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
  ];
});
</script>

<template>
  <nav class="flex h-16 w-full items-center justify-around border-t bg-white px-4">
    <RouterLink
      v-for="navItem in navItems"
      :key="navItem.label"
      :to="navItem.to"
      class="flex items-center gap-3 rounded-lg px-3 py-2"
      :active-class="!navItem.exact ? 'text-blue-600' : ''"
      :exact-active-class="navItem.exact ? 'text-blue-600' : ''"
      :aria-label="$t(navItem.label)"
    >
      <component :is="navItem.icon" :alt="$t(navItem.label)" />
    </RouterLink>
  </nav>
</template>
