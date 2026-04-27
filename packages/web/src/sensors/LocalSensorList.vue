<script setup lang="ts">
import { useCommandStation } from '@/commandstation/useCommandStation';
import { useCommandStationStatusStore } from '@/commandstation/useCommandStationStatusStore';
import Button from '@/core/components/ui/button/Button.vue';
import Empty from '@/core/components/ui/empty/Empty.vue';
import EmptyDescription from '@/core/components/ui/empty/EmptyDescription.vue';
import EmptyHeader from '@/core/components/ui/empty/EmptyHeader.vue';
import EmptyMedia from '@/core/components/ui/empty/EmptyMedia.vue';
import EmptyTitle from '@/core/components/ui/empty/EmptyTitle.vue';
import Table from '@/core/components/ui/table/Table.vue';
import TableBody from '@/core/components/ui/table/TableBody.vue';
import TableCell from '@/core/components/ui/table/TableCell.vue';
import TableHead from '@/core/components/ui/table/TableHead.vue';
import TableHeader from '@/core/components/ui/table/TableHeader.vue';
import TableRow from '@/core/components/ui/table/TableRow.vue';
import { FolderCode, TrashIcon, UploadIcon } from 'lucide-vue-next';
import { useLocalSensorStore, type LocalSensorDefinition } from './useLocalSensorStore';

defineProps<{
  sensors: LocalSensorDefinition[];
}>();

const cs = useCommandStation();
const localSensorStore = useLocalSensorStore();
const commandStationStatusStore = useCommandStationStatusStore();

function removeLocalSensor(id: number) {
  localSensorStore.removeSensor(id);
}

function uploadSensorToCs(sensorInfo: LocalSensorDefinition) {
  if (
    sensorInfo.id === undefined ||
    sensorInfo.vPin === undefined ||
    sensorInfo.pullUp === undefined
  ) {
    console.error('Invalid sensor info:', sensorInfo);
    return;
  }
  cs.addSensor(sensorInfo.id, sensorInfo.vPin, sensorInfo.pullUp);
}
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Sensor ID</TableHead>
        <TableHead>vPin</TableHead>
        <TableHead>Pull-Up</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody v-if="sensors.length > 0">
      <TableRow v-for="sensorInfo in sensors" :key="sensorInfo.id">
        <TableCell>{{ sensorInfo.id }}</TableCell>
        <TableCell>{{ sensorInfo.vPin }}</TableCell>
        <TableCell>{{ sensorInfo.pullUp }}</TableCell>
        <TableCell>
          {{
            commandStationStatusStore.sensors[sensorInfo.id]
              ? commandStationStatusStore.sensors[sensorInfo.id].value
                ? 'Active'
                : 'Inactive'
              : '-'
          }}
        </TableCell>
        <TableCell class="flex gap-2">
          <Button @click="uploadSensorToCs(sensorInfo)" variant="outline" size="icon-sm">
            <UploadIcon />
          </Button>
          <Button @click="removeLocalSensor(sensorInfo.id)" variant="outline" size="icon-sm">
            <TrashIcon />
          </Button>
        </TableCell>
      </TableRow>
    </TableBody>
    <TableBody v-else>
      <TableRow>
        <TableCell colspan="4" class="text-center">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderCode />
              </EmptyMedia>
              <EmptyTitle>No Sensors Yet</EmptyTitle>
            </EmptyHeader>
            <EmptyDescription> No sensors found. Please refresh the sensor list. </EmptyDescription>
          </Empty>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
