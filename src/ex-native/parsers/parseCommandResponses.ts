import type { CommandParser } from './CommandParser';

export type RosterEntry = { address: number; name: string };
export type TurnoutEntry = { id: number; name: string; status: string };
export type CsSensorInfo = { id: number; vPin?: number; pullUp?: boolean };
export type CsSensorValue = { id: number; value: boolean };

/** `<JR>` → list of roster addresses (`jR` without a quoted name). */
export const parseRosterAddressList: CommandParser<number[]> = ({ command, params }) => {
  if (command === 'jR' && !params[1]?.startsWith('"')) {
    return params.map((param) => Number(param));
  }
  return undefined;
};

/** `<JR <address>>` → a named roster entry (`jR` with a quoted name). */
export const parseRosterEntry: CommandParser<RosterEntry> = ({ command, params }) => {
  if (command === 'jR' && params[1]?.startsWith('"')) {
    return {
      address: Number(params[0]),
      name: params[1].substring(1, params[1].length - 1),
    };
  }
  return undefined;
};

/** `<JT>` → turnout id list (`jT` without a quoted name). */
export const parseTurnoutIdList: CommandParser<number[]> = ({ command, params }) => {
  if (command === 'jT' && !params[2]?.startsWith('"')) {
    return params.map((param) => Number(param));
  }
  return undefined;
};

/** `<JT <id>>` → a named turnout entry (`jT` with a quoted name). */
export const parseTurnoutEntry: CommandParser<TurnoutEntry> = ({ command, params }) => {
  if (command === 'jT' && params[2]?.startsWith('"')) {
    return {
      id: Number(params[0]),
      name: params[2].substring(1, params[2].length - 1) ?? '',
      status: params[1] ?? '',
    };
  }
  return undefined;
};

/** `<R <address>>` → the read CV value (`v <address> <value>`). */
export const parseCvValue: CommandParser<{ address: number; value: number }> = ({
  command,
  params,
}) => {
  if (command === 'v') {
    return { address: Number(params[0]), value: Number(params[1] ?? -1) };
  }
  return undefined;
};

/** `<S>` → a sensor definition (`Q <id> <vpin> <pullup>`, 3 params). */
export const parseSensorDefinition: CommandParser<CsSensorInfo> = ({ command, params }) => {
  if (command === 'Q' && params.length === 3) {
    return {
      id: +params[0],
      vPin: +params[1],
      pullUp: params[2] === '1',
    };
  }
  return undefined;
};