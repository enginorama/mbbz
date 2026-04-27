import type { CommandParser } from './CommandParser';

export type SensorStatus = {
  id: number;
  value: boolean;
};

export const parseSensorStatus: CommandParser<SensorStatus> = ({ command, params }) => {
  if ((command === 'Q' || command === 'q') && params.length === 1) {
    return {
      id: +params[0],
      value: command === 'Q',
    };
  }
  return null;
};
