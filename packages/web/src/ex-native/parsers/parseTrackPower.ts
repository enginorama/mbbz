import type { CommandParser } from './CommandParser';

export type TrackPower = {
  track: string;
  on: boolean;
};

export const parseTrackPower: CommandParser<TrackPower> = ({ command, params }) => {
  if ((command === 'p1' || command === 'p0') && params.length === 1 && params[0].length === 1) {
    return {
      track: params[0],
      on: command === 'p1',
    };
  }
  return undefined;
};
