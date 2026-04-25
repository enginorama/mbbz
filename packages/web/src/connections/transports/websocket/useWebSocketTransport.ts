import { useExStationInputBus, useExStationOutputBus } from '@/connections/ExEventBus';
import { useConnectionLogger } from '@/connections/useConnectionLogger';
import { inject, onUnmounted, provide, readonly, ref, type InjectionKey, type Ref } from 'vue';
import { toast } from 'vue-sonner';
import { useTransportStatusStore } from '../useTransportStatusStore';

const websocketTransportInjectionKey: InjectionKey<{
  connect: (url: string) => void;
  disconnect: () => void;
  isConnected: Readonly<Ref<boolean>>;
  isConnecting: Readonly<Ref<boolean>>;
}> = Symbol('websocket-transport');

export const useWebSocketTransport = () => {
  const transport = inject(websocketTransportInjectionKey);
  if (!transport) {
    throw new Error('WebSocket transport not provided');
  }
  return transport;
};

export const provideWebSocketTransport = () => {
  const inputBus = useExStationInputBus();
  const outputBus = useExStationOutputBus();
  const transportStatusStore = useTransportStatusStore();
  const { log } = useConnectionLogger();

  const socket = ref<WebSocket | null>(null);
  const connecting = ref(false);
  const isConnected = ref(false);

  function connect(url: string) {
    if (socket.value) {
      toast.warning('Already connected');
      return;
    }
    connecting.value = true;
    try {
      socket.value = new WebSocket(url);
      socket.value.addEventListener('open', () => {
        transportStatusStore.setStatus('websocket', 'connected');
        isConnected.value = true;
        connecting.value = false;
        log({ type: 'INFO', message: 'WebSocket connected.', transport: 'websocket' });
      });
      socket.value.addEventListener('message', (event) => {
        log({ type: 'IN', message: event.data, transport: 'websocket' });
        inputBus.emit(event.data);
      });
      socket.value.addEventListener('close', () => {
        transportStatusStore.setStatus('websocket', 'disconnected');
        isConnected.value = false;
        connecting.value = false;
        log({ type: 'INFO', message: 'WebSocket disconnected.', transport: 'websocket' });
        socket.value = null;
      });
      socket.value.addEventListener('error', (event) => {
        transportStatusStore.setStatus('websocket', 'disconnected');
        isConnected.value = false;
        connecting.value = false;
        toast.error('WebSocket error');
        console.error('WebSocket error:', event);
      });
    } catch (e) {
      transportStatusStore.setStatus('websocket', 'disconnected');
      isConnected.value = false;
      connecting.value = false;
      toast.error('Failed to connect to WebSocket');
      console.error(e);
    }
  }

  outputBus.on((msg) => {
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      log({ type: 'OUT', message: msg, transport: 'websocket' });
      socket.value.send(msg);
    }
  });

  onUnmounted(() => {
    if (socket.value) {
      socket.value.close();
    }
  });

  provide(websocketTransportInjectionKey, {
    connect,
    disconnect: () => {
      if (socket.value) {
        socket.value.close();
      }
    },
    isConnected: readonly(isConnected),
    isConnecting: readonly(connecting),
  });
};
