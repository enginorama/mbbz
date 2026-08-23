import type { DccExCommand } from '../ExNativeTokenizer';
import type { CommandStationInfo } from './parseCommandStationInfo';
import { parseCommandStationInfo } from './parseCommandStationInfo';
import type { SensorStatus } from './parseSensorStatus';
import { parseSensorStatus } from './parseSensorStatus';
import type { TrackConfiguration } from './parseTrackConfiguration';
import { parseTrackConfiguration } from './parseTrackConfiguration';
import type { TrackPower } from './parseTrackPower';
import { parseTrackPower } from './parseTrackPower';
import { parseNumMaxSupportedCabs } from './parseNumMaxSupportedCabs';
import { parsePauseStatus } from './parsePauseStatus';

/**
 * A parsed DCC-EX packet, discriminated by `type`. Each result wraps the raw parser output in an
 * object, so a valid `0` or `false` is never mistaken for "no match" — the wrapper object is
 * always truthy and `undefined` is the single convention for "not handled".
 */
export type ParsedCommandResult =
  | { type: 'commandStationInfo'; data: CommandStationInfo }
  | { type: 'sensorStatus'; data: SensorStatus }
  | { type: 'trackConfiguration'; data: TrackConfiguration }
  | { type: 'trackPower'; data: TrackPower }
  | { type: 'numMaxSupportedCabs'; data: number }
  | { type: 'pauseStatus'; data: boolean };

/** Wraps a parser's raw result into a discriminated result, or `undefined` if not handled. */
function parsed<K extends string, D>(
  type: K,
  data: D | undefined,
): { type: K; data: D } | undefined {
  return data === undefined ? undefined : { type, data };
}

/**
 * The packet registry. Each entry is an individual parser; adding a packet type is adding one
 * entry here rather than editing a call site. Order is still significant when two parsers could
 * match the same packet, but each parser self-guards on its own fields.
 */
const parsers: ReadonlyArray<(command: DccExCommand) => ParsedCommandResult | undefined> = [
  (command) => parsed('commandStationInfo', parseCommandStationInfo(command)),
  (command) => parsed('sensorStatus', parseSensorStatus(command)),
  (command) => parsed('trackConfiguration', parseTrackConfiguration(command)),
  (command) => parsed('trackPower', parseTrackPower(command)),
  (command) => parsed('numMaxSupportedCabs', parseNumMaxSupportedCabs(command)),
  (command) => parsed('pauseStatus', parsePauseStatus(command)),
];

/** Decodes a single packet, returning the first matching result or `undefined`. */
export function parseCommand(command: DccExCommand): ParsedCommandResult | undefined {
  for (const parse of parsers) {
    const result = parse(command);
    if (result) return result;
  }
  return undefined;
}