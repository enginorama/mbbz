import { useExNativeInputBus } from '@/connections/ExEventBus';
import { useCommandStationStatusStore } from './useCommandStationStatusStore';

export function provideCommandStationInfoSync() {
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
    }
  });
}
