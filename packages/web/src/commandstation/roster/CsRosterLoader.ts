import { useDccInputBus, useRawOutputBus } from '@/connections/connections';

export function useRosterSync() {
  const dccInputBus = useDccInputBus();
  dccInputBus.on((packet) => {
    if (packet.command === 'jR') {
      if (packet.params[1]?.startsWith(`"`)) {
        const name = packet.params[1].slice(1, -1);
        if (name) {
          const functionString = (packet.params[2] || '').slice(1, -1);
          const functionArray = functionString.split('/');
          console.log('new roster entry', name, functionArray);
        } else {
          console.warn('No roster entry for', packet.params[0]);
        }
      }
    }
  });
}

export function useRefreshRoster() {
  const outputBus = useRawOutputBus();
  outputBus.emit('<JR>');
}
