import { shallowRef } from 'vue';

type ConnectionLogMessage = {
  type: 'IN' | 'OUT' | 'INFO';
  message: string;
};

const logMessages = shallowRef<ConnectionLogMessage[]>([]);

export function useConnectionLogger() {
  function log(message: ConnectionLogMessage) {
    logMessages.value = [...logMessages.value.slice(-299), message];
  }

  return { logMessages, log };
}
