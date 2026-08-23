import { inject, provide, ref, type InjectionKey, type Ref } from 'vue';
import { useExNativeInputBus } from '@/connections/ExEventBus';
import { ExNativeNormalizer } from '@/ex-native/ExNativeNormalizer';
import { tokenizeExNativeString } from '@/ex-native/ExNativeTokenizer';
import type { DccTransport, TransportConnectOptions, TransportId } from './types';

/**
 * The orchestrator for all transports. Transports are pure I/O adapters registered here; the
 * manager owns which one is the active connection and routes everything through it:
 *
 * - `connect(id, opts)` makes `id` the active connection (disconnecting any previous one), so
 *   only a single connection is ever open.
 * - `send(data)` writes to the active transport only — the outbound command string bus is gone.
 * - inbound data from the active transport is fed through a single streaming decoder that
 *   tokenizes the DCC-EX protocol and emits parsed packets on the domain packet bus.
 */
export class ConnectionManager {
  private transports = new Map<TransportId, DccTransport>();
  private activeId = ref<TransportId | null>(null);

  private packetBus = useExNativeInputBus();

  // One streaming decoder shared by all transports (serial streams arrive in chunks; WebSocket
  // frames may split commands), so every transport is decoded the same way.
  private normalizer = new ExNativeNormalizer((line) => {
    const packets = tokenizeExNativeString(line);
    for (const packet of packets) {
      this.packetBus.emit(packet);
    }
  });

  /** Registers a transport and wires its inbound data into the shared decoder. */
  register(t: DccTransport) {
    this.transports.set(t.id, t);
    t.setDataHandler((data) => this.normalizer.parseChunk(data));
  }

  unregister(id: TransportId) {
    this.transports.delete(id);
    if (this.activeId.value === id) {
      this.activeId.value = null;
    }
  }

  get(id: TransportId): DccTransport | undefined {
    return this.transports.get(id);
  }

  get activeTransportId(): Readonly<Ref<TransportId | null>> {
    return this.activeId;
  }

  get active(): DccTransport | null {
    const id = this.activeId.value;
    return id ? (this.transports.get(id) ?? null) : null;
  }

  /** Connects `id`, making it the single active connection. Returns whether it connected. */
  async connect(id: TransportId, opts: TransportConnectOptions): Promise<boolean> {
    const transport = this.transports.get(id);
    if (!transport) return false;
    const previous = this.active;
    if (previous && previous.id !== id) {
      await previous.disconnect();
    }
    const ok = await transport.connect(opts);
    if (ok && transport.connected.value) {
      this.activeId.value = id;
    }
    return ok;
  }

  async disconnect(id?: TransportId): Promise<void> {
    const target = id ? this.transports.get(id) : this.active;
    if (!target) return;
    await target.disconnect();
    if (this.activeId.value === target.id) {
      this.activeId.value = null;
    }
  }

  /** Sends a raw command through the active connection, if one is connected. */
  async send(data: string): Promise<void> {
    const active = this.active;
    if (active && active.connected.value) {
      await active.send(data);
    }
  }

  /** Runs each transport's optional startup hook. */
  async restore(): Promise<void> {
    for (const transport of this.transports.values()) {
      await transport.restore?.();
    }
  }
}

const connectionManagerKey: InjectionKey<ConnectionManager> = Symbol('connection-manager');

/**
 * Provides a `ConnectionManager` for the current component tree. Pass `manager` to override (e.g.
 * a fake in tests).
 */
export function provideConnectionManager(manager = new ConnectionManager()): ConnectionManager {
  provide(connectionManagerKey, manager);
  return manager;
}

/** Returns the `ConnectionManager` provided by an ancestor. */
export function useConnectionManager(): ConnectionManager {
  const manager = inject(connectionManagerKey);
  if (!manager) {
    throw new Error('ConnectionManager not provided');
  }
  return manager;
}