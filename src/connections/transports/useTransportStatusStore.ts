import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useTransportStatusStore = defineStore('transportStatus', () => {
  const statuses = ref<Record<string, 'connected' | 'disconnected'>>({});

  function setStatus(transport: string, status: 'connected' | 'disconnected') {
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
