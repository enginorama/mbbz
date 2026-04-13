<script setup lang="ts">
import { useCommandStation } from '@/commandstation/useCommandStation';
import { useExNativeInputBus } from '@/connections/ExEventBus';
import PageTitle from '@/core/components/PageTitle.vue';
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
import { useDialog } from '@/core/dialogs/core/useDialog';
import AddSensorDialog from '@/sensors/AddSensorDialog.vue';
import { FolderCode } from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';

type SensorInfo = {
  id: number;
  value?: boolean;
  config: {
    vPin?: number;
    pullUp?: boolean;
  };
};

const cs = useCommandStation();
const exNativeInputBus = useExNativeInputBus();

const sensorInfos = ref(new Map<number, SensorInfo>());
const localSensors = ref(new Map<number, SensorInfo>());

const sensorInfoList = computed(() =>
  Array.from(new Map([...sensorInfos.value, ...localSensors.value]).values()).sort(
    (a, b) => a.id - b.id,
  ),
);

exNativeInputBus.on((command) => {
  if (command.command === 'Q') {
    if (command.params.length === 1) {
      const sensorId = +command.params[0];
      setSensorValue(sensorId, true);
    }
    if (command.params.length === 3) {
      const sensorId = +command.params[0];
      const sensorVPin = +command.params[1];
      const sensorPullUp = command.params[2] === '1';
      const sensorInfo = sensorInfos.value.get(sensorId);
      if (sensorInfo) {
        sensorInfo.config.vPin = sensorVPin;
        sensorInfo.config.pullUp = sensorPullUp;
      } else {
        sensorInfos.value.set(sensorId, {
          id: sensorId,
          value: true,
          config: {
            vPin: sensorVPin,
            pullUp: sensorPullUp,
          },
        });
      }
    }
  }
  if (command.command === 'q') {
    const sensorId = +command.params[0];
    setSensorValue(sensorId, false);
  }
});

function setSensorValue(sensorId: number, value: boolean) {
  const sensorInfo = sensorInfos.value.get(sensorId);
  if (sensorInfo) {
    sensorInfo.value = value;
  } else {
    sensorInfos.value.set(sensorId, {
      id: sensorId,
      value: value,
      config: {},
    });
  }
}

const dialog = useDialog();

async function addSensor() {
  const newSensorConfig = await dialog.show(AddSensorDialog, {});
  if (!newSensorConfig) return;
  const { sensorId, vPin, pullUp } = newSensorConfig;
  localSensors.value.set(sensorId, {
    id: sensorId,
    config: {
      vPin,
      pullUp: pullUp === '1',
    },
  });
  cs.addSensor(sensorId, vPin, pullUp === '1');
  cs.refreshSensorList();
}

onMounted(() => {
  cs.refreshSensorList();
  cs.refreshSensorValues();
});
</script>

<template>
  <div>
    <PageTitle title="Sensors" />
    <Item variant="muted" class="mb-4 flex items-center justify-between gap-4">
      <div class="flex gap-4">
        <Button @click="cs.refreshSensorList()">Refresh Sensor List</Button>
        <Button @click="cs.refreshSensorValues()">Refresh Sensor Values</Button>
      </div>
      <Button @click="addSensor">Add Sensor</Button>
    </Item>
    <div>
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
            <TableCell>{{ sensorInfo.value }}</TableCell>
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
  </div>
</template>
