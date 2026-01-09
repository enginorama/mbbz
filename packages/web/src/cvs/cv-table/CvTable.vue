<script setup lang="ts">
import { CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import Card from '@/core/components/ui/card/Card.vue';
import { TableBody } from '@/core/components/ui/table';
import Table from '@/core/components/ui/table/Table.vue';
import TableHead from '@/core/components/ui/table/TableHead.vue';
import TableHeader from '@/core/components/ui/table/TableHeader.vue';
import TableRow from '@/core/components/ui/table/TableRow.vue';
import type { CvData } from '../CvData';
import CvTableRow from './CvTableRow.vue';

defineProps<{
  cvData: Array<CvData>;
}>();
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>CV Table</CardTitle>
    </CardHeader>
    <CardContent
      class="px-0 **:data-[slot=table-cell]:first:px-6 **:data-[slot=table-head]:first:px-6"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Address</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Decimal</TableHead>
            <TableHead>Hex</TableHead>
            <TableHead>Binary</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <CvTableRow v-for="data in cvData" :key="data.address" :cv-data="data" />
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</template>
