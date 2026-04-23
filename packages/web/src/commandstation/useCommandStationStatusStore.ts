import { defineStore } from 'pinia';
import { ref } from 'vue';

export type CommandStationInfo = {
  version: string;
  boardType: string;
  motorShield: string;
  buildNumber: string;
};

export const useCommandStationStatusStore = defineStore('commandStationStatus', () => {
  const info = ref<CommandStationInfo | null>(null);

  return {
    info,
    setInfo(newInfo: CommandStationInfo) {
      info.value = newInfo;
    },
  };
});
