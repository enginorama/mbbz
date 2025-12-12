<script setup lang="ts">
import Card from '@/core/components/ui/card/Card.vue';
import CardContent from '@/core/components/ui/card/CardContent.vue';
import CardDescription from '@/core/components/ui/card/CardDescription.vue';
import CardFooter from '@/core/components/ui/card/CardFooter.vue';
import CardHeader from '@/core/components/ui/card/CardHeader.vue';
import CardTitle from '@/core/components/ui/card/CardTitle.vue';
import Separator from '@/core/components/ui/separator/Separator.vue';

const props = defineProps<{
  cvAddress: number;
}>();
</script>

<template>
  <Card>
    <div class="flex">
      <CardHeader class="w-28 border-r text-center">
        <CardTitle class="text-4xl">{{ cvAddress }}</CardTitle>
        <CardDescription>CV</CardDescription>
      </CardHeader>
      <CardContent class="pt-6">
        <p>Card Content</p>
      </CardContent>
    </div>
    <Separator />
    <CardFooter class="pt-6">
      <p>Card Footer</p>
    </CardFooter>
  </Card>
</template>
