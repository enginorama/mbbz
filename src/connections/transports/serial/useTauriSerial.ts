import { ref } from 'vue';
import { ExTauriSerial } from './ExTauriSerial';

export function useTauriSerial(callback: (msg: string) => void) {
  const connected = ref(false);

  const exTauriSerial = new ExTauriSerial({
    onData: callback,
    onConnectionStatusChange: (status) => {
      connected.value = status === 'connected';
    },
  });

  return {
    open: exTauriSerial.open.bind(exTauriSerial),
    close: exTauriSerial.close.bind(exTauriSerial),
    getAvailablePorts: ExTauriSerial.getAvailablePorts.bind(ExTauriSerial),
    writeToStream: exTauriSerial.writeToStream.bind(exTauriSerial),
    connected,
    isSupported: ExTauriSerial.isSupported,
  };
}
