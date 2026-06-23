<script setup lang="ts">
import { MenuIcon } from '@lucide/vue';
import Button from './components/ui/button/Button.vue';
import { useSidebar } from './components/ui/sidebar';
const { toggleSidebar } = useSidebar();

defineProps<{
  title?: string;
}>();
</script>

<template>
  <div class="flex h-14 shrink-0 items-center gap-4 border-b bg-white px-4 md:hidden">
    <Button @click="toggleSidebar" variant="ghost" size="icon">
      <MenuIcon></MenuIcon>
    </Button>
    <div class="flex-1">{{ title }}</div>
  </div>
</template>
