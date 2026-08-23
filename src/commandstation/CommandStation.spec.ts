import type { ConnectionManager } from '@/connections/ConnectionManager';
import type { DccExCommand } from '@/ex-native/ExNativeTokenizer';
import { describe, expect, it, vi } from 'vitest';
import { CommandStation } from './CommandStation';

describe('CommandStation packet dispatch', () => {
  it('normalizes raw chunks and dispatches packets to scoped listeners', () => {
    let handleData: (data: string) => void = () => {};
    const connectionManager = {
      send: vi.fn<(data: string) => Promise<void>>(),
      setDataHandler(handler: (data: string) => void) {
        handleData = handler;
      },
    } as unknown as ConnectionManager;
    const commandStation = new CommandStation(connectionManager);
    const packets: DccExCommand[] = [];
    const cabPackets: DccExCommand[] = [];

    commandStation.onPacket((packet) => packets.push(packet));
    const stopListeningForCabs = commandStation.onCommand('l', (packet) => cabPackets.push(packet));

    handleData('<l 3');
    handleData(' 0><Q 7>');
    stopListeningForCabs();
    handleData('<l 4 0>');

    expect(packets).toEqual([
      { command: 'l', params: ['3', '0'] },
      { command: 'Q', params: ['7'] },
      { command: 'l', params: ['4', '0'] },
    ]);
    expect(cabPackets).toEqual([{ command: 'l', params: ['3', '0'] }]);
  });

  it('discards partial input when the connection stream resets', () => {
    let handleData: (data: string) => void = () => {};
    let resetData = () => {};
    const connectionManager = {
      send: vi.fn<(data: string) => Promise<void>>(),
      setDataHandler(handler: (data: string) => void, resetHandler: () => void) {
        handleData = handler;
        resetData = resetHandler;
      },
    } as unknown as ConnectionManager;
    const commandStation = new CommandStation(connectionManager);
    const packets: DccExCommand[] = [];
    commandStation.onPacket((packet) => packets.push(packet));

    handleData('<Q old');
    resetData();
    handleData(' stream><Q new>');

    expect(packets).toEqual([{ command: 'Q', params: ['new'] }]);
  });

  it('applies listener mutations to subsequent packets', () => {
    let handleData: (data: string) => void = () => {};
    const connectionManager = {
      send: vi.fn<(data: string) => Promise<void>>(),
      setDataHandler(handler: (data: string) => void) {
        handleData = handler;
      },
    } as unknown as ConnectionManager;
    const commandStation = new CommandStation(connectionManager);
    const calls: string[] = [];
    const packetLate = () => calls.push('packet late');
    const commandLate = () => calls.push('command late');
    let stopPacketSecond = () => {};
    let stopCommandSecond = () => {};

    commandStation.onPacket(() => {
      calls.push('packet first');
      stopPacketSecond();
      commandStation.onPacket(packetLate);
    });
    stopPacketSecond = commandStation.onPacket(() => calls.push('packet second'));
    commandStation.onCommand('Q', () => {
      calls.push('command first');
      stopCommandSecond();
      commandStation.onCommand('Q', commandLate);
    });
    stopCommandSecond = commandStation.onCommand('Q', () => calls.push('command second'));

    handleData('<Q>');
    expect(calls).toEqual(['packet first', 'packet second', 'command first', 'command second']);

    calls.length = 0;
    handleData('<Q>');
    expect(calls).toEqual(['packet first', 'packet late', 'command first', 'command late']);
  });
});
