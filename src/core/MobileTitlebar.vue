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
  <div class="navbar-top flex shrink-0 items-center gap-4 border-b bg-white px-4 pb-2 md:hidden">
    <Button @click="toggleSidebar" variant="ghost" size="icon">
      <MenuIcon></MenuIcon>
    </Button>
    <div class="flex-1">{{ title }}</div>
  </div>
</template>

<style scoped>
.navbar-top {
  padding-top: calc(env(safe-area-inset-top) + 0.5rem);
}
</style>
