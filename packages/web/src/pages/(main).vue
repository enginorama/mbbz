<script setup lang="ts">
import AppSidebar from '@/core/components/sidebar/AppSidebar.vue';
import SidebarProvider from '@/core/components/ui/sidebar/SidebarProvider.vue';
</script>

<template>
  <SidebarProvider style="--sidebar-width: 16rem; --sidebar-width-mobile: 18rem">
    <AppSidebar />
    <main class="p-6">
      <RouterView />
    </main>
  </SidebarProvider>
</template>
