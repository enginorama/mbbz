<script setup lang="ts">
import AppSidebar from '@/core/components/sidebar/AppSidebar.vue';
import SidebarProvider from '@/core/components/ui/sidebar/SidebarProvider.vue';
import MobileMenubar from '@/core/MobileMenubar.vue';
import MobileTitlebar from '@/core/MobileTitlebar.vue';
import { Toaster } from 'vue-sonner';
</script>

<template>
  <SidebarProvider style="--sidebar-width: 16rem; --sidebar-width-mobile: 18rem" class="h-svh">
    <AppSidebar />
    <main class="w-full overflow-auto pb-14 md:pb-0 [&>div]:p-6">
      <div class="h-14 p-0! md:hidden"><MobileTitlebar /></div>
      <RouterView />
    </main>
    <div class="fixed right-0 bottom-0 left-0 md:hidden"><MobileMenubar /></div>
    <Toaster :rich-colors="true" />
  </SidebarProvider>
</template>
