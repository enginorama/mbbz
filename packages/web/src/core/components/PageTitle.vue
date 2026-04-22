<script setup lang="ts">
import MobileTitlebar from '../MobileTitlebar.vue';

defineProps<{
  title: string;
  subtitle?: string;
}>();
</script>

<template>
  <div class="min-h-14">
    <MobileTitlebar :title="title" />
    <div class="mb-6 hidden items-center justify-between md:flex">
      <div>
        <h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">{{ title }}</h1>
        <p v-if="subtitle" class="text-muted-foreground mt-2 text-sm">{{ subtitle }}</p>
      </div>
      <div class="mt-4">
        <slot></slot>
      </div>
    </div>
  </div>
</template>
