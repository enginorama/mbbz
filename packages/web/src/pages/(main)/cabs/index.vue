<script setup lang="ts">
import PageTitle from '@/core/components/PageTitle.vue';
import Button from '@/core/components/ui/button/Button.vue';
import Empty from '@/core/components/ui/empty/Empty.vue';
import EmptyContent from '@/core/components/ui/empty/EmptyContent.vue';
import EmptyDescription from '@/core/components/ui/empty/EmptyDescription.vue';
import EmptyHeader from '@/core/components/ui/empty/EmptyHeader.vue';
import EmptyMedia from '@/core/components/ui/empty/EmptyMedia.vue';
import EmptyTitle from '@/core/components/ui/empty/EmptyTitle.vue';
import { FolderCode } from 'lucide-vue-next';
</script>

<template>
  <PageTitle title="Cabs" subtitle="Manage your rolling stock" />
  <Empty>
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <FolderCode />
      </EmptyMedia>
      <EmptyTitle>No Cabs Yet</EmptyTitle>
      <EmptyDescription>
        You haven't created any cabs yet. Get started by creating your first cab.
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <div class="flex gap-2">
        <Button>Create Cab</Button>
        <Button variant="outline"> Reload from CS </Button>
      </div>
    </EmptyContent>
  </Empty>
</template>
