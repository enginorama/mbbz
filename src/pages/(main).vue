<script setup lang="ts">
import AppSidebar from '@/core/components/sidebar/AppSidebar.vue';
import SidebarProvider from '@/core/components/ui/sidebar/SidebarProvider.vue';
import MobileMenubar from '@/core/MobileMenubar.vue';
</script>

<template>
  <SidebarProvider style="--sidebar-width: 16rem; --sidebar-width-mobile: 18rem" class="h-svh">
    <AppSidebar />
    <div class="flex w-full flex-col overflow-hidden">
      <RouterView />
      <div class="shrink-0 md:hidden"><MobileMenubar /></div>
    </div>
  </SidebarProvider>
</template>
