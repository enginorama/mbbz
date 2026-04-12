<script setup lang="ts">
import { useCommandStation } from '@/commandstation/useCommandStation';
import { useExNativeInputBus } from '@/connections/ExEventBus';
import PageTitle from '@/core/components/PageTitle.vue';
import Button from '@/core/components/ui/button/Button.vue';
import Input from '@/core/components/ui/input/Input.vue';
import Item from '@/core/components/ui/item/Item.vue';
import { useDialog } from '@/core/dialogs/core/useDialog';
import AddSensorDialog from '@/sensors/AddSensorDialog.vue';
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
const sensorInfoList = computed(() =>
  Array.from(sensorInfos.value.values()).sort((a, b) => a.id - b.id),
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
      <h2 class="mb-2 text-lg font-semibold">Sensor Values</h2>
      <ul>
        <li v-for="sensorInfo in sensorInfoList" :key="sensorInfo.id">
          Sensor {{ sensorInfo.id }}: {{ sensorInfo.value ? 'ON' : 'OFF' }} [{{
            sensorInfo.config.vPin ? `vPin: ${sensorInfo.config.vPin}` : ''
          }},
          {{
            sensorInfo.config.pullUp != null
              ? sensorInfo.config.pullUp
                ? 'pull-up'
                : 'no pull-up'
              : ''
          }}]
        </li>
      </ul>
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
