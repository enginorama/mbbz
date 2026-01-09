import { useExNativeInputBus } from '@/connections/ExEventBus';
import type { DccExCommand } from '@/protocols/DccEx';
import { NUM_CAB_FUNCTIONS, type CabDirection } from './CabState';
import { useCabStatesStore } from './useCabStatesStore';

export function setupCabStateSync() {
  const cabStates = useCabStatesStore();
  const exNativeInputBus = useExNativeInputBus();

  exNativeInputBus.on((command) => {
    analyseCommand(command);
  });

  function analyseCommand(command: DccExCommand) {
    if (command.command === 'l') {
      const dccAddress = Number(command.params[0]);
      const slot = Number(command.params[1]);
      const speedAndDir = Number(command.params[2]);
      const functionStates = Number(command.params[3])
        .toString(2)
        .padStart(NUM_CAB_FUNCTIONS, '0')
        .split('')
        .map((s) => s === '1')
        .reverse();
      let speed = (speedAndDir & 0x7f) - 1;
      if (speed < 0) speed = 0;
      let isEmergencyStopped = false;
      if (speedAndDir === 1 || speedAndDir === 129) {
        speed = 0;
        isEmergencyStopped = true;
      }
      const direction: CabDirection = (speedAndDir & 0x80) > 0 ? 'forward' : 'reverse';
      cabStates.update({
        dccAddress,
        slot,
        direction,
        functionStates,
        isEmergencyStopped,
        speed,
      });
    }
  }
}
