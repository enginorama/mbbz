import type { CommandStationInfo } from '@/ex-native/parsers/parseCommandStationInfo';
import type { SensorStatus } from '@/ex-native/parsers/parseSensorStatus';
import type { TrackConfiguration } from '@/ex-native/parsers/parseTrackConfiguration';
import type { TrackPower } from '@/ex-native/parsers/parseTrackPower';
import { defineStore } from 'pinia';
import { readonly, ref } from 'vue';

export const useCommandStationStatusStore = defineStore('commandStationStatus', () => {
  const info = ref<CommandStationInfo | null>(null);
  const sensors = ref<Record<string, SensorStatus>>({});

  const trackConfigurations = ref<Record<string, TrackConfiguration>>({});
  const trackPowers = ref<Record<string, TrackPower>>({});

  const numMaxSupportedCabs = ref<number | null>(null);

  return {
    info: readonly(info),
    sensors: readonly(sensors),
    trackConfigurations: readonly(trackConfigurations),
    trackPowers: readonly(trackPowers),
    numMaxSupportedCabs: readonly(numMaxSupportedCabs),
    setInfo(newInfo: CommandStationInfo) {
      info.value = newInfo;
    },
    setSensorStatus(sensorStatus: SensorStatus) {
      sensors.value[sensorStatus.id] = sensorStatus;
    },
    setTrackConfiguration(trackConfiguration: TrackConfiguration) {
      trackConfigurations.value[trackConfiguration.track] = trackConfiguration;
    },
    setTrackPower(trackPower: TrackPower) {
      trackPowers.value[trackPower.track] = trackPower;
    },
    setNumMaxSupportedCabs(num: number | null) {
      numMaxSupportedCabs.value = num;
    },
  };
});
