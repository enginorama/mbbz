<script setup lang="ts">
import MobileTitlebar from '../MobileTitlebar.vue';
import PageTitle from './PageTitle.vue';

defineProps<{
  title: string;
  subtitle?: string;
  fillContent?: boolean;
}>();
</script>

<template>
  <div class="flex w-full shrink grow flex-col overflow-hidden">
    <MobileTitlebar :title="title" />
    <main
      class="flex w-full flex-col overflow-auto px-4 pt-4 pb-6 md:px-6 md:pt-0"
      :class="{ 'flex-1': fillContent }"
    >
      <PageTitle :title="title" :subtitle="subtitle"><slot name="actions"></slot></PageTitle>
      <slot></slot>
    </main>
  </div>
</template>
