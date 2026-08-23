import { inject, provide, type InjectionKey } from 'vue';
import { CommandStation } from './CommandStation';

const commandStationKey: InjectionKey<CommandStation> = Symbol('command-station');

/**
 * Registers a pre-built `CommandStation` for injection into the current component tree. The
 * caller is responsible for constructing it (e.g. `new CommandStation(io)`), which keeps this
 * provider free of any dependency on the connection layer and easy to use with a fake in tests.
 */
export function provideCommandStation(commandStation: CommandStation): CommandStation {
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
