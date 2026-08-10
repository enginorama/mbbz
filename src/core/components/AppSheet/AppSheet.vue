<script setup lang="ts">
import { useBreakpoints } from '@vueuse/core';
import { computed } from 'vue';
import AppDialog from './AppDialog.vue';
import AppDrawer from './AppDrawer.vue';

withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    dismissible?: boolean;
    teleport?: boolean;
  }>(),
  {
    dismissible: true,
    teleport: true,
  },
);

const breakpoints = useBreakpoints({
  mobile: 0, // optional
  tablet: 640,
  laptop: 1024,
  desktop: 1280,
});

const renderDrawer = breakpoints.smallerOrEqual('laptop');

const usedComponent = computed(() => (renderDrawer.value ? AppDrawer : AppDialog));
</script>

<template>
  <component
    :is="usedComponent"
    :title="title"
    :description="description"
    :dismissible="dismissible"
    :teleport="teleport"
  >
    <template v-if="$slots.trigger" #trigger>
      <slot name="trigger"></slot>
    </template>
    <template #default="{ close }">
      <slot :close="close"></slot>
    </template>
  </component>
</template>
