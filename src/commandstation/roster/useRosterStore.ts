import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface RosterEntry {
  address: number;
  name: string;
  functionMap: Map<number, string>;
}

export const useRosterStore = defineStore('roster', () => {
  const roster = ref<Map<number, RosterEntry>>(new Map());

  return { roster };
});
