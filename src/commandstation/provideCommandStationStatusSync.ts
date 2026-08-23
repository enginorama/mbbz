import { parseCommand } from '@/ex-native/parsers/parseCommand';
import type { CommandStation } from './CommandStation';
import { useCommandStationStatusStore } from './useCommandStationStatusStore';

export function provideCommandStationStatusSync(commandStation: CommandStation) {
  const commandStationStatusStore = useCommandStationStatusStore();

  return commandStation.onPacket((command) => {
    const result = parseCommand(command);
    if (!result) return;

    switch (result.type) {
      case 'commandStationInfo':
        commandStationStatusStore.setInfo(result.data);
        break;
      case 'sensorStatus':
        commandStationStatusStore.setSensorStatus(result.data);
        break;
      case 'trackConfiguration':
        commandStationStatusStore.setTrackConfiguration(result.data);
        break;
      case 'trackPower':
        commandStationStatusStore.setTrackPower(result.data);
        break;
      case 'numMaxSupportedCabs':
        commandStationStatusStore.setNumMaxSupportedCabs(result.data);
        break;
      case 'pauseStatus':
        commandStationStatusStore.setIsPaused(result.data);
        break;
    }
  });
}
