<script setup lang="ts">
import { TableBody, TableCell, TableRow } from '@/core/components/ui/table';
import Table from '@/core/components/ui/table/Table.vue';
import TableHead from '@/core/components/ui/table/TableHead.vue';
import TableHeader from '@/core/components/ui/table/TableHeader.vue';
import type { CvData } from '../CvData';

defineProps<{
  cvData: Array<CvData>;
}>();
</script>

<template>
  <Table>
    <TableHeader>
      <TableHead>Address</TableHead>
      <TableHead>Title</TableHead>
      <TableHead>Value</TableHead>
    </TableHeader>
    <TableBody>
      <TableRow v-for="data in cvData" :key="data.address">
        <TableCell>{{ data.address }}</TableCell>
        <TableCell>{{ data.title }}</TableCell>
        <TableCell>{{ data.value?.value }}</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
