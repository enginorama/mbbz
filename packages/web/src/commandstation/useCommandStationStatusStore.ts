import type { SensorStatus } from '@/ex-native/parsers/parseSensorStatus';
import { defineStore } from 'pinia';
import { readonly, ref } from 'vue';

export type CommandStationInfo = {
  version: string;
  boardType: string;
  motorShield: string;
  buildNumber: string;
};

export const useCommandStationStatusStore = defineStore('commandStationStatus', () => {
  const info = ref<CommandStationInfo | null>(null);
  const sensors = ref<Record<string, SensorStatus>>({});

  return {
    info: readonly(info),
    sensors: readonly(sensors),
    setInfo(newInfo: CommandStationInfo) {
      info.value = newInfo;
    },
    setSensorStatus(sensorStatus: SensorStatus) {
      sensors.value[sensorStatus.id] = sensorStatus;
    },
  };
});
