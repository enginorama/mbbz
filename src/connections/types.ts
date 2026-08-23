import type { Ref } from 'vue';
import type { TauriSerialTransport } from './transports/serial/TauriSerialTransport';
import type { WebSerialTransport } from './transports/serial/WebSerialTransport';
import type { UdpMulticastTransport } from './transports/udpMulticast/UdpMulticastTransport';
import type { WebSocketTransport } from './transports/websocket/WebSocketTransport';

/** Maps each transport ID to its concrete implementation. Extend via declaration merging. */
export interface TransportMap {
  websocket: WebSocketTransport;
  webSerial: WebSerialTransport;
  tauriSerial: TauriSerialTransport;
  udpMulticast: UdpMulticastTransport;
}

/** Maps each transport ID to its connection options. Extend alongside `TransportMap`. */
export interface TransportConnectOptionsMap {
  websocket: { kind: 'websocket'; url: string };
  webSerial: { kind: 'webSerial'; port?: SerialPort };
  tauriSerial: { kind: 'tauriSerial'; path?: string };
  udpMulticast: {
    kind: 'udpMulticast';
    group: string;
    deviceAddress: string;
    port: number;
    label?: string;
  };
}

/** Identifies a transport that can connect to the command station. */
export type TransportId = keyof TransportMap & keyof TransportConnectOptionsMap;

export type TransportConnectOptions<Id extends TransportId = TransportId> =
  TransportConnectOptionsMap[Id];

/**
 * A transport is a pure I/O adapter for one way of reaching the command station. It knows
 * nothing about the rest of the app: no event bus, no notion of "active". It simply exposes its
 * connection state, can be told to connect/disconnect, sends raw commands, and hands every chunk
 * of inbound data to the handler the orchestrator assigns via `setDataHandler`.
 */
export interface DccTransport<Id extends TransportId = TransportId> {
  readonly id: Id;
  readonly isSupported: boolean;
  readonly connected: Ref<boolean>;
  readonly connecting: Ref<boolean>;

  /** The orchestrator assigns the handler that consumes raw inbound data. */
  setDataHandler(fn: (data: string) => void): void;

  connect(opts: TransportConnectOptions<Id>): Promise<boolean>;
  disconnect(): Promise<void>;
  send(data: string): Promise<void>;

  /** Optional startup hook (e.g. UDP restoring a listener that survived a page reload). */
  restore?(): Promise<void>;
}
