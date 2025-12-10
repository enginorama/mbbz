import { describe, it, expect } from 'vitest';
import { parseDccExString } from './DccEx';

// The two tests marked with concurrent will be run in parallel
describe('DCC Ex Parser', () => {
  it('detects a command', async () => {
    expect(parseDccExString('<test>')).toEqual([
      {
        command: 'test',
        params: [],
      },
    ]);
  });

  it('ignores multiple spaces', async () => {
    expect(parseDccExString('<S 1        3  4>')).toEqual([
      {
        command: 'S',
        params: ['1', '3', '4'],
      },
    ]);
  });

  it('supports multiple commands', async () => {
    expect(parseDccExString('<S 1><S 2>')).toEqual([
      {
        command: 'S',
        params: ['1'],
      },
      {
        command: 'S',
        params: ['2'],
      },
    ]);
  });

  it('supports string params', async () => {
    expect(parseDccExString('<S this is the way>')).toEqual([
      {
        command: 'S',
        params: ['this', 'is', 'the', 'way'],
      },
    ]);
  });

  it('ignores junk', async () => {
    expect(parseDccExString('some random input 😒')).toEqual([]);
  });
});
