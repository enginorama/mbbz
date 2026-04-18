<script setup lang="ts">
import { MenuIcon } from 'lucide-vue-next';
import Button from './components/ui/button/Button.vue';
import { useSidebar } from './components/ui/sidebar';
const { toggleSidebar } = useSidebar();
</script>

<template>
  <div class="flex h-14 items-center justify-end gap-4 border-b px-4">
    <Button @click="toggleSidebar" variant="ghost" size="icon">
      <MenuIcon></MenuIcon>
    </Button>
  </div>
</template>
