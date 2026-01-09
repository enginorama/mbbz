import { ref } from 'vue';
import { ExWebSerial } from './ExWebSerial';

export type WebSerialConfig = {
  port: SerialPort;
};

export function useWebSerial(callback: (msg: string) => void) {
  const connected = ref(false);

  const exWebSerial = new ExWebSerial({
    onData: callback,
    onConnectionStatusChange: (status) => {
      connected.value = status === 'connected';
    },
  });

  return {
    open: exWebSerial.open.bind(exWebSerial),
    close: exWebSerial.close.bind(exWebSerial),
    getPorts: exWebSerial.getPorts.bind(exWebSerial),
    writeToStream: exWebSerial.writeToStream.bind(exWebSerial),
    connected,
    isSupported: exWebSerial.isSupported,
  };
}
