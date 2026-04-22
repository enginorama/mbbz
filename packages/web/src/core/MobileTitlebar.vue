<script setup lang="ts">
import { MenuIcon } from 'lucide-vue-next';
import Button from './components/ui/button/Button.vue';
import { useSidebar } from './components/ui/sidebar';
const { toggleSidebar } = useSidebar();

defineProps<{
  title?: string;
}>();
</script>

<template>
  <div
    class="absolute top-0 right-0 left-0 flex h-14 items-center gap-4 border-b bg-white px-4 md:hidden"
  >
    <Button @click="toggleSidebar" variant="ghost" size="icon">
      <MenuIcon></MenuIcon>
    </Button>
    <div class="flex-1">{{ title }}</div>
  </div>
</template>
