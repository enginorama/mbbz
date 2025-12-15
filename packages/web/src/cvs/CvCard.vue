<script setup lang="ts">
import ConfirmDialogButton from '@/core/components/ConfirmDialogButton.vue';
import Badge from '@/core/components/ui/badge/Badge.vue';
import { Button } from '@/core/components/ui/button';
import Card from '@/core/components/ui/card/Card.vue';
import CardAction from '@/core/components/ui/card/CardAction.vue';
import CardContent from '@/core/components/ui/card/CardContent.vue';
import CardDescription from '@/core/components/ui/card/CardDescription.vue';
import CardFooter from '@/core/components/ui/card/CardFooter.vue';
import CardHeader from '@/core/components/ui/card/CardHeader.vue';
import CardTitle from '@/core/components/ui/card/CardTitle.vue';
import { EditIcon, RefreshCwIcon, TrashIcon } from 'lucide-vue-next';
import { computed } from 'vue';
import { cvAnalyer } from './analysis/CvAnalyser';
import CvValue from './CvValue.vue';

const props = defineProps<{
  address: number;
  title: string;
  value?: number;
  fetching?: boolean;
}>();

defineEmits<{
  (e: 'edit', id: number): void;
  (e: 'refresh', id: number): void;
  (e: 'delete', id: number): void;
}>();

const shortInfo = computed(() => {
  if (props.value == null) {
    return null;
  }
  return cvAnalyer.getShortAnalysis(props.address, props.value);
});
</script>

<template>
  <Card class="flex flex-col gap-0 p-0">
    <CardHeader class="grid-rows-1 gap-0 px-4 py-1">
      <CardTitle class="text-md flex h-10 items-center justify-between font-medium opacity-60">
        <div class="overflow-hidden text-ellipsis whitespace-nowrap" :title="title">
          {{ title }}
        </div>
      </CardTitle>
      <CardAction>
        <Button variant="ghost" size="icon" class="cursor-pointer" @click="$emit('edit', address)">
          <EditIcon class="h-4 w-4 opacity-60" />
        </Button>
      </CardAction>
    </CardHeader>
    <CardContent class="flex min-h-30 grow items-stretch justify-center border-t p-0">
      <div class="flex w-30 flex-col items-center justify-center border-r text-center">
        <CardTitle class="text-4xl">{{ address }}</CardTitle>
        <CardDescription>CV</CardDescription>
      </div>
      <div class="flex grow items-center justify-center">
        <Button
          v-if="value === undefined || value === -1"
          class="text-md group relative"
          :class="
            value === undefined ? 'text-muted-foreground/70' : 'text-destructive-foreground/70'
          "
          @click="$emit('refresh', address)"
          :diabled="fetching"
          variant="ghost"
        >
          <span class="group-hover:opacity-0">{{
            value === undefined ? 'No value' : 'Error reading value'
          }}</span>
          <RefreshCwIcon class="invisible absolute group-hover:visible" />
        </Button>
        <CvValue v-else :value="value" />
      </div>
    </CardContent>
    <CardFooter class="justify-between border-t px-4 py-1 [.border-t]:pt-2">
      <div class="min-w-0 shrink">
        <Badge
          v-if="shortInfo"
          :title="shortInfo"
          variant="secondary"
          class="block w-auto shrink bg-blue-500 text-ellipsis text-white hover:bg-blue-400"
          >{{ shortInfo }}
        </Badge>
      </div>
      <div class="h-10 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          class="cursor-pointer"
          @click="$emit('refresh', address)"
          :disabled="fetching"
        >
          <RefreshCwIcon class="h-4 w-4 opacity-60" :class="{ 'animate-spin': fetching }" />
        </Button>
        <ConfirmDialogButton
          title="Delete CV?"
          description="Are you sure you want to delete this CV? This action cannot be undone."
          @confirm="$emit('delete', address)"
        >
          <Button
            variant="ghost"
            size="icon"
            class="cursor-pointer"
            @click="$emit('delete', address)"
          >
            <TrashIcon class="h-4 w-4 opacity-60" />
          </Button>
        </ConfirmDialogButton>
      </div>
    </CardFooter>
  </Card>
</template>
