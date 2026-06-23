import { describe, expect, it } from 'vitest';
import { tokenizeExNativeString } from './ExNativeTokenizer';

describe('DCC Ex Parser', () => {
  it('detects a command', async () => {
    expect(tokenizeExNativeString('<test>')).toEqual([
      {
        command: 'test',
        params: [],
      },
    ]);
  });

  it('ignores multiple spaces', async () => {
    expect(tokenizeExNativeString('<S 1        3  4>')).toEqual([
      {
        command: 'S',
        params: ['1', '3', '4'],
      },
    ]);
  });

  it('supports multiple commands', async () => {
    expect(tokenizeExNativeString('<S 1><S 2>')).toEqual([
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
    expect(tokenizeExNativeString('<S this is the way>')).toEqual([
      {
        command: 'S',
        params: ['this', 'is', 'the', 'way'],
      },
    ]);
  });

  it('ignores junk', async () => {
    expect(tokenizeExNativeString('some random input 😒')).toEqual([]);
  });

  it('parses commands inside junk', async () => {
    expect(tokenizeExNativeString('junk ><S 1>-.junk')).toEqual([
      {
        command: 'S',
        params: ['1'],
      },
    ]);
  });

  describe('supports parameters in quotation marks', () => {
    it('supports quoted params', async () => {
      expect(tokenizeExNativeString('<S "this is a single param">')).toEqual([
        {
          command: 'S',
          params: ['"this is a single param"'],
        },
      ]);
    });
    it('supports multiple quoted params', async () => {
      expect(tokenizeExNativeString('<S "this is param one" "and this is param two">')).toEqual([
        {
          command: 'S',
          params: ['"this is param one"', '"and this is param two"'],
        },
      ]);
    });
  });

  describe('Characters discouraged in the specs', () => {
    it('allows a < character in quoted parameters', async () => {
      expect(tokenizeExNativeString('<S "with a < in it">')).toEqual([
        {
          command: 'S',
          params: ['"with a < in it"'],
        },
      ]);
    });

    it('will end the command on a > character, even in quotes', async () => {
      expect(tokenizeExNativeString('<S "with a > in it">')).toEqual([
        {
          command: 'S',
          params: ['with', 'a'],
        },
      ]);
    });

    it('will ignore single quotation marks', async () => {
      expect(tokenizeExNativeString('<S "single param" "split missing>')).toEqual([
        {
          command: 'S',
          params: ['"single param"', 'split', 'missing'],
        },
      ]);
    });

    it('escaping is not supported', async () => {
      expect(tokenizeExNativeString('<S "single \\"param\\"">')).toEqual([
        {
          command: 'S',
          params: ['""'],
        },
      ]);
    });
  });
});
