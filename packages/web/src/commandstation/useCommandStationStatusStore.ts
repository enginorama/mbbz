import type { CommandStationInfo } from '@/ex-native/parsers/parseCommandStationInfo';
import type { SensorStatus } from '@/ex-native/parsers/parseSensorStatus';
import type { TrackConfiguration } from '@/ex-native/parsers/parseTrackConfiguration';
import type { TrackPower } from '@/ex-native/parsers/parseTrackPower';
import { defineStore } from 'pinia';
import { readonly, ref } from 'vue';

export const useCommandStationStatusStore = defineStore('commandStationStatus', () => {
  const info = ref<CommandStationInfo | undefined>();
  const sensors = ref<Record<string, SensorStatus>>({});

  const trackConfigurations = ref<Record<string, TrackConfiguration>>({});
  const trackPowers = ref<Record<string, TrackPower>>({});

  const numMaxSupportedCabs = ref<number | undefined>();

  const isPaused = ref<boolean | undefined>();

  return {
    info: readonly(info),
    sensors: readonly(sensors),
    trackConfigurations: readonly(trackConfigurations),
    trackPowers: readonly(trackPowers),
    numMaxSupportedCabs: readonly(numMaxSupportedCabs),
    isPaused: readonly(isPaused),
    setInfo(newInfo: CommandStationInfo | undefined) {
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
    setNumMaxSupportedCabs(num: number | undefined) {
      numMaxSupportedCabs.value = num;
    },
    setIsPaused(paused: boolean | undefined) {
      isPaused.value = paused;
    },
  };
});
