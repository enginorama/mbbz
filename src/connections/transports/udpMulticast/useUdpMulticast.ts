import {
  isUdpMulticastSupported,
  sendUdpMessage,
  startUdpMulticastListener,
  stopUdpMulticastListener,
} from '@/lib/tauriUdpMulticast';
import { ref } from 'vue';

export function useUdpMulticast(callback: (data: string) => void) {
  const connected = ref(false);
  // Commands are sent unicast directly to the command station's own address, not to the
  // multicast group (which has no listener able to reply as a specific device).
  let sendTarget: { address: string; port: number } | null = null;

  async function open(group: string, deviceAddress: string, port: number): Promise<boolean> {
    const started = await startUdpMulticastListener(group, port, callback);
    connected.value = started;
    sendTarget = started ? { address: deviceAddress, port } : null;
    return started;
  }

  async function close(): Promise<void> {
    await stopUdpMulticastListener();
    connected.value = false;
    sendTarget = null;
  }

  async function send(data: string): Promise<void> {
    if (!sendTarget) return;
    await sendUdpMessage(sendTarget.address, sendTarget.port, data);
  }

  return {
    open,
    close,
    send,
    connected,
    isSupported: isUdpMulticastSupported,
  };
}
