import { useExNativeInputBus } from '@/connections/ExEventBus';
import { parseSensorStatus } from '@/ex-native/parsers/parseSensorStatus';
import { useCommandStationStatusStore } from './useCommandStationStatusStore';

export function provideCommandStationStatusSync() {
  const exNativeInputBus = useExNativeInputBus();
  const commandStationStatusStore = useCommandStationStatusStore();

  exNativeInputBus.on((command) => {
    if (command.command === 'iDCC-EX') {
      commandStationStatusStore.setInfo({
        version: command.params[0] ?? '',
        boardType: command.params[2] ?? '',
        motorShield: command.params[4] ?? '',
        buildNumber: command.params[5] ?? '',
      });
      return;
    }

    const sensorStatus = parseSensorStatus(command);
    if (sensorStatus) {
      commandStationStatusStore.setSensorStatus(sensorStatus);
      return;
    }
  });
}
