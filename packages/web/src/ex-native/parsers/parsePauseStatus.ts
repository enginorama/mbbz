import type { CommandParser } from './CommandParser';

export const parsePauseStatus: CommandParser<boolean> = ({ command }) => {
  if (command === '!RESUMED') {
    return false;
  }
  if (command === '!PAUSED') {
    return true;
  }
  return undefined;
};
