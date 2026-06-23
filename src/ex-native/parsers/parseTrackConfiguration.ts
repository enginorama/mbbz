import type { CommandParser } from './CommandParser';

export enum TrackMode {
  UNKNOWN = 'UNKNOWN',
  PROG = 'PROG',
  MAIN = 'MAIN',
  NONE = 'NONE',
  DC = 'DC',
  DV_INV = 'DV_INV',
}

export type TrackConfiguration = {
  track: string;
  mode: TrackMode;
};

function parseTrackMode(value: string): TrackMode {
  switch (value) {
    case 'PROG':
      return TrackMode.PROG;
    case 'MAIN':
      return TrackMode.MAIN;
    case 'NONE':
      return TrackMode.NONE;
    case 'DC':
      return TrackMode.DC;
    case 'DV_INV':
      return TrackMode.DV_INV;
    default:
      return TrackMode.UNKNOWN;
  }
}

export const parseTrackConfiguration: CommandParser<TrackConfiguration> = ({ command, params }) => {
  if (command === '=' && params.length === 2) {
    return {
      track: params[0],
      mode: parseTrackMode(params[1]),
    };
  }
  return undefined;
};
