<script setup lang="ts">
import Item from './ui/item/Item.vue';
</script>

<template>
  <Item variant="muted" class="mb-4 flex items-center justify-between gap-4">
    <div class="flex items-center gap-2">
      <slot></slot>
    </div>
    <div class="flex gap-2">
      <slot name="actions"></slot>
    </div>
  </Item>
</template>
