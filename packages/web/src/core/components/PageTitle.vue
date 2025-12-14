<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
}>();
</script>

<template>
  <div class="flex items-center justify-between">
    <div>
      <h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">{{ title }}</h1>
      <p v-if="subtitle" class="text-muted-foreground mt-2 text-sm">{{ subtitle }}</p>
    </div>
    <div class="mt-4">
      <slot></slot>
    </div>
  </div>
</template>
