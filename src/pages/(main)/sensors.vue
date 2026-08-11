<script setup lang="ts">
import { useCommandStation } from '@/commandstation/useCommandStation';
import { useCommandStationStatusStore } from '@/commandstation/useCommandStationStatusStore';
import { useAppSheet } from '@/core/components/AppSheet/useAppSheet';
import PageLayout from '@/core/components/PageLayout.vue';
import Button from '@/core/components/ui/button/Button.vue';
import Empty from '@/core/components/ui/empty/Empty.vue';
import EmptyDescription from '@/core/components/ui/empty/EmptyDescription.vue';
import EmptyHeader from '@/core/components/ui/empty/EmptyHeader.vue';
import EmptyMedia from '@/core/components/ui/empty/EmptyMedia.vue';
import EmptyTitle from '@/core/components/ui/empty/EmptyTitle.vue';
import Input from '@/core/components/ui/input/Input.vue';
import Item from '@/core/components/ui/item/Item.vue';
import Table from '@/core/components/ui/table/Table.vue';
import TableBody from '@/core/components/ui/table/TableBody.vue';
import TableCell from '@/core/components/ui/table/TableCell.vue';
import TableHead from '@/core/components/ui/table/TableHead.vue';
import TableHeader from '@/core/components/ui/table/TableHeader.vue';
import TableRow from '@/core/components/ui/table/TableRow.vue';
import AddSensorSheet from '@/sensors/AddSensorSheet.vue';
import LocalSensorList from '@/sensors/LocalSensorList.vue';
import type { SensorInfo } from '@/sensors/SensorInfo';
import { useLocalSensorStore } from '@/sensors/useLocalSensorStore';
import { FolderCode, PlusIcon } from '@lucide/vue';
import { computed, onMounted, ref } from 'vue';

const cs = useCommandStation();

const sensorInfos = ref(new Map<number, SensorInfo>());
const localSensorStore = useLocalSensorStore();
const commandStationStatusStore = useCommandStationStatusStore();
const fetchingSensorValues = ref(false);
const fetchingSensorList = ref(false);

const sensorInfoList = computed(() =>
  Array.from(new Map(sensorInfos.value).values()).sort((a, b) => a.id - b.id),
);

async function fetchSensorList() {
  fetchingSensorList.value = true;
  const sensors = await cs.getSensorList();
  const sensorInfoMap = new Map<number, SensorInfo>();
  sensors.forEach((sensor) => {
    sensorInfoMap.set(sensor.id, {
      id: sensor.id,
      config: {
        vPin: sensor.vPin,
        pullUp: sensor.pullUp,
      },
    });
  });
  sensorInfos.value = sensorInfoMap;
  fetchingSensorList.value = false;
}

async function fetchSensorValues() {
  fetchingSensorValues.value = true;
  await cs.getSensorValues();
  fetchingSensorValues.value = false;
}

const { show } = useAppSheet();

async function addSensor() {
  const newSensorConfig = await show(AddSensorSheet, {});
  if (!newSensorConfig) return;
  const { sensorId, vPin, pullUp } = newSensorConfig;
  localSensorStore.addSensor({
    id: sensorId,
    vPin,
    pullUp: pullUp === '1',
  });
  cs.addSensor(sensorId, vPin, pullUp === '1');
  cs.refreshSensorList();
}

onMounted(async () => {
  await fetchSensorList();
  await fetchSensorValues();
});
</script>

<template>
  <PageLayout :title="$t('pages.sensors.title')">
    <Item variant="muted" class="mb-4 flex items-center justify-between gap-4">
      <div class="flex gap-4">
        <Button @click="() => fetchSensorList()" :disabled="fetchingSensorList">
          {{ $t('pages.sensors.refreshList') }}
        </Button>
        <Button @click="() => fetchSensorValues()" :disabled="fetchingSensorValues">
          {{ $t('pages.sensors.refreshValues') }}
        </Button>
      </div>
      <Button @click="addSensor"><PlusIcon /> {{ $t('pages.sensors.addSensor') }}</Button>
    </Item>
    <div>
      <h2 class="mb-2 text-lg font-semibold">Local Sensors</h2>
      <LocalSensorList :sensors="localSensorStore.sensors" />
    </div>
    <div class="mt-8">
      <h2 class="mb-2 text-lg font-semibold">CS Sensors</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sensor ID</TableHead>
            <TableHead>vPin</TableHead>
            <TableHead>Pull-Up</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody v-if="sensorInfoList.length > 0">
          <TableRow v-for="sensorInfo in sensorInfoList" :key="sensorInfo.id">
            <TableCell>{{ sensorInfo.id }}</TableCell>
            <TableCell>{{ sensorInfo.config.vPin }}</TableCell>
            <TableCell>{{ sensorInfo.config.pullUp }}</TableCell>
            <TableCell>{{ commandStationStatusStore.sensors[sensorInfo.id]?.value }}</TableCell>
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
                <EmptyDescription>
                  No sensors found. Please refresh the sensor list.
                </EmptyDescription>
              </Empty>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
    <div class="mt-8">
      <h2 class="mb-2 text-lg font-semibold">Set Output Pin</h2>
      <Input
        placeholder="Set Output Pin (e.g. 1000:1 for ON, 1000:0 for OFF)"
        @keydown.enter="
          (event: KeyboardEvent) => {
            const value = (event.target as HTMLInputElement).value;
            const match = value.match(/(\d+):(\d+)/);
            if (match) {
              const pin = +match[1];
              const state = match[2] === '1';
              cs.setOutputPin(pin, state);
              (event.target as HTMLInputElement).value = '';
            }
          }
        "
      />
    </div>
  </PageLayout>
</template>
