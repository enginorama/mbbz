import { useCommandStation } from '@/commandstation/useCommandStation';
import { useCvStore } from './useCvStore';

/**
 * CV actions that talk to the command station, kept separate from the pure `useCvStore` so the
 * store has no dependency on the connection layer.
 */
export function useCvActions() {
  const cvStore = useCvStore();
  const commandStation = useCommandStation();

  async function readCv(address: number): Promise<void> {
    cvStore.setReading(address);
    const value = await commandStation.readCv(address);
    cvStore.setValue(address, value);
  }

  async function refreshAll(addresses: Iterable<number>): Promise<void> {
    for (const address of addresses) {
      await readCv(address);
    }
  }

  return {
    readCv,
    refreshAll,
    clearCv: cvStore.clearCv,
    clear: cvStore.clear,
  };
}
