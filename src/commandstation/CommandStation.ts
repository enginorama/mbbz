import type { ConnectionIo } from '@/connections/ConnectionManager';
import { ExNativeNormalizer } from '@/ex-native/ExNativeNormalizer';
import { tokenizeExNativeString, type DccExCommand } from '@/ex-native/ExNativeTokenizer';
import {
  parseCvValue,
  parseRosterAddressList,
  parseRosterEntry,
  parseSensorDefinition,
  parseTurnoutEntry,
  parseTurnoutIdList,
} from '@/ex-native/parsers/parseCommandResponses';
import type {
  CsSensorInfo,
  CsSensorValue,
  RosterEntry,
  TurnoutEntry,
} from '@/ex-native/parsers/parseCommandResponses';
import { parseSensorStatus } from '@/ex-native/parsers/parseSensorStatus';
import { Queue } from '@/lib/queue';

export type {
  CsSensorInfo,
  CsSensorValue,
  RosterEntry,
  TurnoutEntry,
} from '@/ex-native/parsers/parseCommandResponses';

type PacketListener = (packet: DccExCommand) => void;

export class CommandStation {
  private queue = new Queue(5);
  private packetListeners = new Set<PacketListener>();
  private commandListeners = new Map<string, Set<PacketListener>>();
  private normalizer: ExNativeNormalizer;

  constructor(private io: ConnectionIo) {
    this.normalizer = new ExNativeNormalizer((line) => {
      for (const packet of tokenizeExNativeString(line)) {
        this.dispatchPacket(packet);
      }
    });
    this.io.onData((data) => this.normalizer.parseChunk(data));
    this.io.onReset(() => this.normalizer.reset());
  }

  public onPacket(listener: PacketListener): () => void {
    this.packetListeners.add(listener);
    return () => this.packetListeners.delete(listener);
  }

  public onCommand(command: string, listener: PacketListener): () => void {
    const listeners = this.commandListeners.get(command) ?? new Set<PacketListener>();
    listeners.add(listener);
    this.commandListeners.set(command, listeners);

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.commandListeners.delete(command);
      }
    };
  }

  private dispatchPacket(packet: DccExCommand): void {
    const packetListeners = [...this.packetListeners];
    const commandListeners = [...(this.commandListeners.get(packet.command) ?? [])];

    for (const listener of packetListeners) {
      listener(packet);
    }
    for (const listener of commandListeners) {
      listener(packet);
    }
  }

  public refreshRoster() {
    void this.queue.add(async () => {
      this.sendCommand('<JR>');
    });
  }

  public async getRosterEntries(): Promise<Array<RosterEntry>> {
    const entries: Array<RosterEntry> = [];
    const rosterAddresses = await this.getRosterAddresses();
    for (const address of rosterAddresses) {
      const entry = await this.getRosterEntry(address);
      if (entry != null) {
        entries.push(entry);
      }
    }
    return entries;
  }

  public async getRosterAddresses(): Promise<number[]> {
    return this.sendAndWaitForResponse<number[]>({
      command: '<JR>',
      decode: parseRosterAddressList,
      defaultValue: [],
    });
  }

  public async getRosterEntry(address: number): Promise<RosterEntry | null> {
    return this.sendAndWaitForResponse<RosterEntry | null>({
      command: `<JR ${address}>`,
      decode: (packet) => {
        const entry = parseRosterEntry(packet);
        return entry && entry.address === address ? entry : undefined;
      },
      defaultValue: null,
    });
  }

  public async getTurnoutEntries(): Promise<Array<TurnoutEntry>> {
    const entries: Array<TurnoutEntry> = [];
    const turnoutIds = await this.getTurnoutIds();
    for (const id of turnoutIds) {
      const entry = await this.getTurnoutEntry(id);
      if (entry != null) {
        entries.push(entry);
      }
    }
    return entries;
  }

  public async getTurnoutIds(): Promise<number[]> {
    return this.sendAndWaitForResponse<number[]>({
      command: '<JT>',
      decode: parseTurnoutIdList,
      defaultValue: [],
    });
  }

  public async getTurnoutEntry(id: number): Promise<TurnoutEntry | null> {
    return this.sendAndWaitForResponse<TurnoutEntry | null>({
      command: `<JT ${id}>`,
      decode: (packet) => {
        const entry = parseTurnoutEntry(packet);
        return entry && entry.id === id ? entry : undefined;
      },
      defaultValue: null,
    });
  }

  public async readCv(address: number): Promise<number> {
    return this.sendAndWaitForResponse<number>({
      command: `<R ${address}>`,
      decode: (packet) => {
        const cv = parseCvValue(packet);
        return cv && cv.address === address ? cv.value : undefined;
      },
      defaultValue: -1,
    });
  }

  public async getSensorList(): Promise<Array<CsSensorInfo>> {
    return this.sendAndCollectResponses<CsSensorInfo>({
      command: '<S>',
      decode: parseSensorDefinition,
    });
  }

  public async getSensorValues(): Promise<Array<CsSensorValue>> {
    return this.sendAndCollectResponses<CsSensorValue>({
      command: '<Q>',
      decode: parseSensorStatus,
    });
  }

  public refreshSensorList() {
    void this.queue.add(async () => {
      this.sendCommand('<S>');
    });
  }

  public refreshSensorValues() {
    void this.queue.add(async () => {
      this.sendCommand('<Q>');
    });
  }

  public requestMaxAllowedCurrent(): Promise<void> {
    return this.queue.add(async () => {
      this.sendCommand('<JG>');
    });
  }

  public requestCurrentsList(): Promise<void> {
    return this.queue.add(async () => {
      this.sendCommand('<JI>');
    });
  }

  public addSensor(sensorId: number, vPin: number, pullUp: boolean) {
    void this.queue.add(async () => {
      this.sendCommand(`<S ${sensorId} ${vPin} ${pullUp ? '1' : '0'}>`);
    });
  }

  public setOutputPin(pin: number, value: boolean) {
    void this.queue.add(async () => {
      this.sendCommand(`<z ${value ? '' : '-'}${pin}>`);
    });
  }

  public sendEmergencyStop() {
    this.sendCommand('<!>');
  }

  public sendPauseCabs() {
    this.sendCommand('<!P>');
  }

  public sendResumeCabs() {
    this.sendCommand('<!R>');
  }

  public requestPauseStatus(): Promise<void> {
    return this.queue.add(async () => {
      this.sendCommand('<!Q>');
    });
  }

  /**
   * Sends a command and waits until `decode` returns a non-undefined value or the timeout is
   * reached. The decode function must return `undefined` for every packet that is not the reply
   * being awaited.
   */
  public async sendAndWaitForResponse<T>({
    command,
    decode,
    defaultValue,
  }: {
    command: string;
    decode: (command: DccExCommand) => T | undefined | null;
    defaultValue: T;
  }): Promise<T> {
    return this.queue.add(async () => {
      const fetchedValue = await new Promise<T>((resolve, reject) => {
        const off = this.onPacket((packet) => {
          const value = decode(packet);
          if (value != null) {
            off();
            resolve(value);
          }
        });
        this.sendCommand(command);
        setTimeout(() => {
          off();
          if (defaultValue === undefined) {
            reject(new Error('Timeout waiting for response'));
            return;
          }
          resolve(defaultValue);
        }, 3000);
      });
      return fetchedValue;
    });
  }

  /**
   * Sends a command and collects every packet `decode` accepts until it stops returning values for
   * a while.
   */
  private async sendAndCollectResponses<T>({
    command,
    decode,
  }: {
    command: string;
    decode: (command: DccExCommand) => T | undefined | null;
  }): Promise<Array<T>> {
    return this.queue.add(async () => {
      const fetchedValues: Array<T> = [];
      await new Promise<void>((resolve) => {
        let timeout: ReturnType<typeof setTimeout> | undefined = undefined;

        const resetTimeout = () => {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            off();
            resolve();
          }, 200);
        };

        const off = this.onPacket((packet) => {
          const value = decode(packet);
          if (value != null) {
            fetchedValues.push(value);
            resetTimeout();
          }
        });

        this.sendCommand(command);
        resetTimeout();
      });
      return fetchedValues;
    });
  }

  /**
   * Immediate write for control commands that need no reply and must never be queued (throttle,
   * emergency stop, pause/resume). Commands that elicit a reply from the station — even if we only
   * refresh and don't await — are wrapped in the queue (see `refreshRoster` etc.) so the station
   * isn't flooded and responses stay ordered.
   */
  private sendCommand(command: string) {
    void this.io.send(command);
  }
}
