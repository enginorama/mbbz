import type { ConnectionIo } from '@/connections/ConnectionManager';
import type { DccExCommand } from '@/ex-native/ExNativeTokenizer';
import { describe, expect, it, vi } from 'vitest';
import { CommandStation } from './CommandStation';

/** A fake `ConnectionIo` whose `deliver`/`reset` always act on the currently-registered handler. */
function makeIo() {
  let handleData: (data: string) => void = () => {};
  let resetData = () => {};
  const io = {
    send: vi.fn<(data: string) => Promise<void>>(),
    onData(handler: (data: string) => void) {
      handleData = handler;
    },
    onReset(handler: () => void) {
      resetData = handler;
    },
  } as unknown as ConnectionIo;
  return {
    io,
    deliver: (data: string) => handleData(data),
    reset: () => resetData(),
  };
}

describe('CommandStation packet dispatch', () => {
  it('normalizes raw chunks and dispatches packets to scoped listeners', () => {
    const { io, deliver } = makeIo();
    const commandStation = new CommandStation(io);
    const packets: DccExCommand[] = [];
    const cabPackets: DccExCommand[] = [];

    commandStation.onPacket((packet) => packets.push(packet));
    const stopListeningForCabs = commandStation.onCommand('l', (packet) => cabPackets.push(packet));

    deliver('<l 3');
    deliver(' 0><Q 7>');
    stopListeningForCabs();
    deliver('<l 4 0>');

    expect(packets).toEqual([
      { command: 'l', params: ['3', '0'] },
      { command: 'Q', params: ['7'] },
      { command: 'l', params: ['4', '0'] },
    ]);
    expect(cabPackets).toEqual([{ command: 'l', params: ['3', '0'] }]);
  });

  it('discards partial input when the connection stream resets', () => {
    const { io, deliver, reset } = makeIo();
    const commandStation = new CommandStation(io);
    const packets: DccExCommand[] = [];
    commandStation.onPacket((packet) => packets.push(packet));

    deliver('<Q old');
    reset();
    deliver(' stream><Q new>');

    expect(packets).toEqual([{ command: 'Q', params: ['new'] }]);
  });

  it('applies listener mutations to subsequent packets', () => {
    const { io, deliver } = makeIo();
    const commandStation = new CommandStation(io);
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

    deliver('<Q>');
    expect(calls).toEqual(['packet first', 'packet second', 'command first', 'command second']);

    calls.length = 0;
    deliver('<Q>');
    expect(calls).toEqual(['packet first', 'packet late', 'command first', 'command late']);
  });
});