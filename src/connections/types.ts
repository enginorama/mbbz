import type { Ref } from 'vue';

/** Identifies a transport that can connect to the command station. */
export type TransportId = 'websocket' | 'webSerial' | 'tauriSerial' | 'udpMulticast';

/** Connect options for each transport, discriminated by kind. */
export type TransportConnectOptions =
  | { kind: 'websocket'; url: string }
  | { kind: 'webSerial'; port?: SerialPort }
  | { kind: 'tauriSerial'; path?: string }
  | { kind: 'udpMulticast'; group: string; deviceAddress: string; port: number; label?: string };

/**
 * A transport is a pure I/O adapter for one way of reaching the command station. It knows
 * nothing about the rest of the app: no event bus, no notion of "active". It simply exposes its
 * connection state, can be told to connect/disconnect, sends raw commands, and hands every chunk
 * of inbound data to the handler the orchestrator assigns via `setDataHandler`.
 */
export interface DccTransport {
  readonly id: TransportId;
  readonly isSupported: boolean;
  readonly connected: Ref<boolean>;
  readonly connecting: Ref<boolean>;

  /** The orchestrator assigns the handler that consumes raw inbound data. */
  setDataHandler(fn: (data: string) => void): void;

  connect(opts: TransportConnectOptions): Promise<boolean>;
  disconnect(): Promise<void>;
  send(data: string): Promise<void>;

  /** Optional startup hook (e.g. UDP restoring a listener that survived a page reload). */
  restore?(): Promise<void>;
}