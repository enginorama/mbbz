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
      <CardTitle>{{ $t('cvs.cvTable.title') }}</CardTitle>
    </CardHeader>
    <CardContent
      class="px-0 **:data-[slot=table-cell]:first:px-6 **:data-[slot=table-head]:first:px-6"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{{ $t('globals.address') }}</TableHead>
            <TableHead>{{ $t('globals.title') }}</TableHead>
            <TableHead>{{ $t('globals.numberFormat.decimal') }}</TableHead>
            <TableHead>{{ $t('globals.numberFormat.hex') }}</TableHead>
            <TableHead>{{ $t('globals.numberFormat.binary') }}</TableHead>
            <TableHead>{{ $t('globals.actions') }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <CvTableRow v-for="data in cvData" :key="data.address" :cv-data="data" />
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</template>
