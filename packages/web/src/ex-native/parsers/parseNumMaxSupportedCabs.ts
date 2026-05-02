import type { CommandParser } from './CommandParser';

export const parseNumMaxSupportedCabs: CommandParser<number> = ({ command, params }) => {
  if (command === '#' && params.length === 1) {
    const num = parseInt(params[0], 10);
    if (!isNaN(num)) {
      return num;
    }
  }
  return null;
};
