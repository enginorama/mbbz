import type { DccExCommand } from '../ExNativeTokenizer';

export type CommandParser<T> = (commmand: DccExCommand) => T | undefined | null;
