import { useExNativeInputBus } from '@/connections/ExEventBus';
import { parseCommandStationInfo } from '@/ex-native/parsers/parseCommandStationInfo';
import { parseSensorStatus } from '@/ex-native/parsers/parseSensorStatus';
import { parseTrackConfiguration } from '@/ex-native/parsers/parseTrackConfiguration';
import { parseTrackPower } from '@/ex-native/parsers/parseTrackPower';
import { useCommandStationStatusStore } from './useCommandStationStatusStore';

export function provideCommandStationStatusSync() {
  const exNativeInputBus = useExNativeInputBus();
  const commandStationStatusStore = useCommandStationStatusStore();

  exNativeInputBus.on((command) => {
    const commandStationInfo = parseCommandStationInfo(command);
    if (commandStationInfo) {
      commandStationStatusStore.setInfo(commandStationInfo);
      return;
    }

    const sensorStatus = parseSensorStatus(command);
    if (sensorStatus) {
      commandStationStatusStore.setSensorStatus(sensorStatus);
      return;
    }

    const trackConfiguration = parseTrackConfiguration(command);
    if (trackConfiguration) {
      commandStationStatusStore.setTrackConfiguration(trackConfiguration);
      return;
    }

    const trackPower = parseTrackPower(command);
    if (trackPower) {
      commandStationStatusStore.setTrackPower(trackPower);
      return;
    }
  });
}
