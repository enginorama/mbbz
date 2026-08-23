import type { WebSocketTransport } from '@/connections/transports/websocket/WebSocketTransport';
import { ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { ConnectionManager } from './ConnectionManager';

describe('ConnectionManager stream lifecycle', () => {
  it('resets the data handler when an active stream starts and ends', async () => {
    const connected = ref(false);
    const transport = {
      id: 'websocket' as const,
      isSupported: true,
      connected,
      connecting: ref(false),
      setDataHandler: vi.fn<(handler: (data: string) => void) => void>(),
      connect: vi.fn<() => Promise<boolean>>(async () => {
        connected.value = true;
        return true;
      }),
      disconnect: vi.fn<() => Promise<void>>(async () => {
        connected.value = false;
      }),
      send: vi.fn<(data: string) => Promise<void>>(),
    } as unknown as WebSocketTransport;
    const manager = new ConnectionManager();
    const resetData = vi.fn<() => void>();
    manager.io.onData(vi.fn<(data: string) => void>());
    manager.io.onReset(resetData);
    manager.register(transport);

    await manager.connect('websocket', { kind: 'websocket', url: 'ws://command-station' });
    expect(resetData).toHaveBeenCalledTimes(1);

    await manager.disconnect();
    expect(resetData).toHaveBeenCalledTimes(2);
  });
});
