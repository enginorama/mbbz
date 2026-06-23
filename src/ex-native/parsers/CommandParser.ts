import type { DccExCommand } from '../ExNativeTokenizer';

export type CommandParser<T> = (command: DccExCommand) => T | undefined;
