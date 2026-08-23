import { inject, provide, type InjectionKey } from 'vue';
import { useConnectionManager } from '@/connections/ConnectionManager';
import { CommandStation } from './CommandStation';

const commandStationKey: InjectionKey<CommandStation> = Symbol('command-station');

/**
 * Provides a single `CommandStation` for the current component tree, wired to the provided
 * `ConnectionManager`. Pass an override to inject a different station in tests.
 */
export function provideCommandStation(commandStation = new CommandStation(useConnectionManager())): CommandStation {
  provide(commandStationKey, commandStation);
  return commandStation;
}

/** Returns the `CommandStation` provided by an ancestor. */
export function useCommandStation(): CommandStation {
  const commandStation = inject(commandStationKey);
  if (!commandStation) {
    throw new Error('CommandStation not provided');
  }
  return commandStation;
}