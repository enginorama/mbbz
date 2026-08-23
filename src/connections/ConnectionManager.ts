import { inject, provide, ref, type InjectionKey, type Ref } from 'vue';
import type { DccTransport, TransportConnectOptions, TransportId, TransportMap } from './types';

/**
 * The orchestrator for all transports. Transports are pure I/O adapters registered here; the
 * manager owns which one is the active connection and routes everything through it:
 *
 * - `connect(id, opts)` makes `id` the active connection (disconnecting any previous one), so
 *   only a single connection is ever open.
 * - `send(data)` writes to the active transport only — the outbound command string bus is gone.
 * - inbound data is forwarded to the registered handler without interpreting its protocol.
 */
export class ConnectionManager {
  private transports = new Map<TransportId, DccTransport>();
  private activeId = ref<TransportId | null>(null);
  private dataHandler: (data: string) => void = () => {};
  private dataResetHandler: () => void = () => {};

  /** Registers a transport and wires its inbound data into the shared handler. */
  register<Id extends TransportId>(transport: TransportMap[Id] & DccTransport<Id>) {
    this.transports.set(transport.id, transport);
    transport.setDataHandler((data) => this.dataHandler(data));
  }

  /** Assigns the protocol layer that consumes raw data and resets it between transport streams. */
  setDataHandler(handler: (data: string) => void, resetHandler: () => void = () => {}): void {
    this.dataHandler = handler;
    this.dataResetHandler = resetHandler;
  }

  unregister(id: TransportId) {
    this.transports.delete(id);
    if (this.activeId.value === id) {
      this.dataResetHandler();
      this.activeId.value = null;
    }
  }

  get<Id extends TransportId>(id: Id): TransportMap[Id] {
    const transport = this.transports.get(id);
    if (!transport) {
      throw new Error(`Transport "${id}" is not registered`);
    }
    return transport as TransportMap[Id];
  }

  /**
   * Looks up a transport by id, narrowed to the matching `DccTransport<Id>`. The cast is sound
   * because `register` always stores a transport under its own `id`.
   */
  private getTransport<Id extends TransportId>(id: Id): DccTransport<Id> | undefined {
    return this.transports.get(id) as DccTransport<Id> | undefined;
  }

  get activeTransportId(): Readonly<Ref<TransportId | null>> {
    return this.activeId;
  }

  get active(): DccTransport | null {
    const id = this.activeId.value;
    return id ? (this.transports.get(id) ?? null) : null;
  }

  /** Connects `id`, making it the single active connection. Returns whether it connected. */
  async connect<Id extends TransportId>(
    id: Id,
    opts: TransportConnectOptions<Id>,
  ): Promise<boolean> {
    const transport = this.getTransport(id);
    if (!transport) return false;
    const previous = this.active;
    if (previous && previous.id !== id) {
      await previous.disconnect();
    }
    this.dataResetHandler();
    const ok = await transport.connect(opts);
    if (ok && transport.connected.value) {
      this.activeId.value = id;
    }
    return ok;
  }

  async disconnect(id?: TransportId): Promise<void> {
    const target = id ? this.getTransport(id) : this.active;
    if (!target) return;
    const wasActive = this.activeId.value === target.id;
    await target.disconnect();
    if (wasActive) {
      this.dataResetHandler();
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
