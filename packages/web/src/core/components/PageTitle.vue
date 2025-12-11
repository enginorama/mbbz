<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
}>();
</script>

<template>
  <div>
    <h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">{{ title }}</h1>
    <p v-if="subtitle" class="text-muted-foreground mt-2 text-sm">{{ subtitle }}</p>
  </div>
</template>
