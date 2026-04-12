import type { InjectionKey, ShallowRef } from 'vue';
import { inject, provide, type Component } from 'vue';
import type { ComponentProps } from 'vue-component-type-helpers';
import type DialogContainer from './DialogContainer.vue';

type UseDialog = {
  show<T extends Component>(
    component: T,
    attrs: ComponentProps<T>,
  ): Promise<DialogComponentReturnValue<T> | undefined>;
};

const DIALOG_CONTAINER_INJECT_KEY = Symbol() as InjectionKey<UseDialog>;

export function useDialog(): UseDialog {
  const injected = inject(DIALOG_CONTAINER_INJECT_KEY);
  if (!injected) throw new Error(`failed to inject ${DIALOG_CONTAINER_INJECT_KEY.toString()}`);
  return injected;
}

export function useCloseDialog<T>(emit: (evt: 'close', result: T) => void): (result: T) => void {
  return (result) => emit('close', result);
}

export function provideDialog(
  // oxlint-disable-next-line typescript/no-redundant-type-constituents
  ref: ShallowRef<InstanceType<typeof DialogContainer> | null>,
): UseDialog {
  const injected: UseDialog = {
    show: async (c, attrs) => ref.value?.show(c, attrs),
  };
  provide(DIALOG_CONTAINER_INJECT_KEY, injected);
  return injected;
}

export type DialogComponentReturnValue<T extends Component> = Parameters<
  NonNullable<ComponentProps<T>['onClose']>
>[0];
