<script setup lang="ts">
import PageTitle from '@/core/components/PageTitle.vue';
import CvCard from '@/cvs/CvCard.vue';

const cvs = [1, 29];
</script>

<template>
  <div>
    <PageTitle title="CVs" subtitle="Read and write CVs" class="mb-6" />
    <div class="flex gap-4">
      <CvCard v-for="cv in cvs" class="min-w-[400px]" :key="cv" :cv-address="cv" />
    </div>
  </div>
</template>
