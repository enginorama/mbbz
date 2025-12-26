<script setup lang="ts">
import TableCell from '@/core/components/ui/table/TableCell.vue';
import TableRow from '@/core/components/ui/table/TableRow.vue';
import type { CvData } from '../CvData';
import { useCvInfo } from '../analysis/CvInfo';

const props = defineProps<{
  cvData: CvData;
}>();

const info = useCvInfo(props.cvData.address);
</script>

<template>
  <TableRow>
    <TableCell>{{ cvData.address }}</TableCell>
    <TableCell>{{ info ?? cvData.title }}</TableCell>
    <TableCell>{{ cvData.value?.value }}</TableCell>
  </TableRow>
</template>
