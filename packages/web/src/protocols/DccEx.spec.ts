import { describe, expect, it } from 'vitest';
import { parseDccExString } from './DccEx';

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

  describe('supports parameters in quotation marks', () => {
    it('supports quoted params', async () => {
      expect(parseDccExString('<S "this is a single param">')).toEqual([
        {
          command: 'S',
          params: ['"this is a single param"'],
        },
      ]);
    });
    it('supports multiple quoted params', async () => {
      expect(parseDccExString('<S "this is param one" "and this is param two">')).toEqual([
        {
          command: 'S',
          params: ['"this is param one"', '"and this is param two"'],
        },
      ]);
    });
  });

  describe('Characters discouraged in the specs', () => {
    it('it allows a < character in quoted parameters', async () => {
      expect(parseDccExString('<S "with a < in it">')).toEqual([
        {
          command: 'S',
          params: ['"with a < in it"'],
        },
      ]);
    });

    it('it will end the command on a > character, even in quotes', async () => {
      expect(parseDccExString('<S "with a > in it">')).toEqual([
        {
          command: 'S',
          params: ['with', 'a'],
        },
      ]);
    });

    it('it will ignore single quotation marks', async () => {
      expect(parseDccExString('<S "single param" "split missing>')).toEqual([
        {
          command: 'S',
          params: ['"single param"', 'split', 'missing'],
        },
      ]);
    });

    it('escaping is not supported', async () => {
      expect(parseDccExString('<S "single \\"param\\"">')).toEqual([
        {
          command: 'S',
          params: ['""'],
        },
      ]);
    });
  });
});
