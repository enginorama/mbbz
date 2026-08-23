import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { TransportId } from '@/connections/types';

const STATUS = {
  connected: 'connected',
  disconnected: 'disconnected',
} as const;

export type TransportStatus = (typeof STATUS)[keyof typeof STATUS];

export const useTransportStatusStore = defineStore('transportStatus', () => {
  const statuses = ref<Partial<Record<TransportId, TransportStatus>>>({});

  function setStatus(transport: TransportId, status: TransportStatus) {
    statuses.value[transport] = status;
  }

  const isConnected = computed(() => {
    return Object.values(statuses.value).some((status) => status === 'connected');
  });

  return {
    statuses,
    setStatus,
    isConnected,
  };
});
