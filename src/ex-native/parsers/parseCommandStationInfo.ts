import type { CommandParser } from './CommandParser';

export type CommandStationInfo = {
  version: string;
  boardType: string;
  motorShield: string;
  buildNumber: string;
};

export const parseCommandStationInfo: CommandParser<CommandStationInfo> = ({ command, params }) => {
  if (command === 'iDCC-EX') {
    return {
      version: params[0] ?? '',
      boardType: params[2] ?? '',
      motorShield: params[4] ?? '',
      buildNumber: params[5] ?? '',
    };
  }
  return undefined;
};
