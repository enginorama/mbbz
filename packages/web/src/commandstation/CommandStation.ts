import { useExNativeInputBus, useExStationOutputBus } from '@/connections/ExEventBus';
import { Queue } from '@/lib/queue';
import type { DccExCommand } from '@/protocols/DccEx';

export interface RosterEntry {
  address: number;
  name: string;
}

export interface TurnoutEntry {
  id: number;
  name: string;
  status: string;
}

export class CommandStation {
  private outputBus = useExStationOutputBus();
  private dccInputBus = useExNativeInputBus();
  private queue = new Queue();

  public async refreshRoster() {
    this.queue.add(async () => {
      this.sendCommand('<JR>');
    });
  }

  public async getRosterEntries(): Promise<Array<RosterEntry>> {
    const entries: Array<RosterEntry> = [];
    const rosterAddresses = await this.getRosterAddresses();
    for (const address of rosterAddresses) {
      const entry = await this.getRosterEntry(address);
      if (entry !== null) {
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
      },
      defaultValue: null,
    });
  }

  public async getTurnoutEntries(): Promise<Array<TurnoutEntry>> {
    const entries: Array<TurnoutEntry> = [];
    const turnoutIds = await this.getTurnoutIds();
    for (const id of turnoutIds) {
      const entry = await this.getTurnoutEntry(id);
      if (entry !== null) {
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
      },
      defaultValue: -1,
    });
  }

  private async sendAndWaitForResponse<T>({
    command,
    callback,
    defaultValue,
  }: {
    command: string;
    callback: (command: DccExCommand) => T | undefined;
    defaultValue: T;
  }): Promise<T> {
    return this.queue.add(async () => {
      const fetchedValue = await new Promise<T>((resolve, reject) => {
        const off = this.dccInputBus.on((packet) => {
          const value = callback(packet);
          if (value !== undefined) {
            off();
            resolve(value);
          }
        });
        this.sendCommand(`${command}`);
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

  private sendCommand(command: string) {
    this.outputBus.emit(command);
  }
}
