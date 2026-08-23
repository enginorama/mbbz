import { useExNativeInputBus } from '@/connections/ExEventBus';
import type { ConnectionManager } from '@/connections/ConnectionManager';
import type { DccExCommand } from '@/ex-native/ExNativeTokenizer';
import { parseSensorStatus } from '@/ex-native/parsers/parseSensorStatus';
import { Queue } from '@/lib/queue';

export interface RosterEntry {
  address: number;
  name: string;
}

export interface TurnoutEntry {
  id: number;
  name: string;
  status: string;
}

export type CsSensorInfo = {
  id: number;
  vPin?: number;
  pullUp?: boolean;
};

export type CsSensorValue = {
  id: number;
  value: boolean;
};

export class CommandStation {
  private dccInputBus = useExNativeInputBus();
  private queue = new Queue(5);

  constructor(private connectionManager: ConnectionManager) {}

  public async refreshRoster() {
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
      callback: (packet) => {
        if (packet.command === 'jR' && !packet.params[1]?.startsWith(`"`)) {
          return packet.params.map((param) => Number(param));
        }
        return undefined;
      },
      defaultValue: [],
    });
  }

  public async getRosterEntry(address: number): Promise<RosterEntry | null> {
    return this.sendAndWaitForResponse<RosterEntry | null>({
      command: `<JR ${address}>`,
      callback: (packet) => {
        if (
          packet.command === 'jR' &&
          Number(packet.params[0]) === address &&
          packet.params[1]?.startsWith(`"`)
        ) {
          const name = packet.params[1].substring(1, packet.params[1].length - 1);
          return { address: address, name: name };
        }
        return undefined;
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
      callback: (packet) => {
        if (packet.command === 'jT' && !packet.params[2]?.startsWith(`"`)) {
          return packet.params.map((param) => Number(param));
        }
        return undefined;
      },
      defaultValue: [],
    });
  }

  public async getTurnoutEntry(id: number): Promise<TurnoutEntry | null> {
    return this.sendAndWaitForResponse<TurnoutEntry | null>({
      command: `<JT ${id}>`,
      callback: (packet) => {
        if (packet.command === 'jT' && packet.params[2]?.startsWith(`"`)) {
          return {
            id: Number(packet.params[0]),
            name: packet.params[2].substring(1, packet.params[2].length - 1) ?? '',
            status: packet.params[1] ?? '',
          };
        }
        return undefined;
      },
      defaultValue: null,
    });
  }

  public async readCv(address: number): Promise<number> {
    return this.sendAndWaitForResponse<number>({
      command: `<R ${address}>`,
      callback: (packet) => {
        if (packet.command === 'v' && Number(packet.params[0]) === address) {
          return Number(packet.params[1] ?? -1);
        }
        return undefined;
      },
      defaultValue: -1,
    });
  }

  public async getSensorList(): Promise<Array<CsSensorInfo>> {
    return this.sendAndCollectResponses<CsSensorInfo>({
      command: '<S>',
      callback: (packet) => {
        if (packet.command === 'Q' && packet.params.length === 3) {
          const sensorId = +packet.params[0];
          const sensorVPin = +packet.params[1];
          const sensorPullUp = packet.params[2] === '1';
          return {
            id: sensorId,
            vPin: sensorVPin,
            pullUp: sensorPullUp,
          };
        }
        return undefined;
      },
    });
  }

  public async getSensorValues(): Promise<Array<CsSensorValue>> {
    return this.sendAndCollectResponses<CsSensorValue>({
      command: '<Q>',
      callback: parseSensorStatus,
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
    return this.queue.add(async () => {
      this.sendCommand('<!R>');
    });
  }

  public requestPauseStatus(): Promise<void> {
    return this.queue.add(async () => {
      this.sendCommand('<!Q>');
    });
  }

  /**
   * Sends a command and waits until the callback returns a non-undefined value or the timeout is reached.
   */
  public async sendAndWaitForResponse<T>({
    command,
    callback,
    defaultValue,
  }: {
    command: string;
    callback: (command: DccExCommand) => T | undefined | null;
    defaultValue: T;
  }): Promise<T> {
    return this.queue.add(async () => {
      const fetchedValue = await new Promise<T>((resolve, reject) => {
        const off = this.dccInputBus.on((packet) => {
          const value = callback(packet);
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
   * Sends a command and collects all responses until the callback only returns undefined values
   * for a certain period of time.
   */
  private async sendAndCollectResponses<T>({
    command,
    callback,
  }: {
    command: string;
    callback: (command: DccExCommand) => T | undefined | null;
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

        const off = this.dccInputBus.on((packet) => {
          const value = callback(packet);
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

  private sendCommand(command: string) {
    void this.connectionManager.send(command);
  }
}
