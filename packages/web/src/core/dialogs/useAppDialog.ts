/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  inject,
  markRaw,
  provide,
  shallowRef,
  type Component,
  type InjectionKey,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue';
import type { ComponentEmit, ComponentExposed, ComponentProps } from 'vue-component-type-helpers';

export type DialogConstructor = new (...args: any) => {
  $emit: { (event: 'close', arg1: any): any };
  show: () => void;
};

export type DialogReturn<C extends Component> =
  ComponentExposed<C> extends { show: () => void }
    ? ComponentEmit<C> extends { (event: 'close', arg1: infer R): void }
      ? R
      : never
    : never;

export function useAppDialog() {
  const { show } = injectDialogSystem();
  return { show };
}

export interface DialogInfo {
  id: number;
  component: DialogConstructor;
  props: MaybeRefOrGetter<ComponentProps<Component>>;
  resolve: (value: any) => void;
}

const dialogSystemInjectionKey = Symbol() as InjectionKey<{
  show: <C extends DialogConstructor>(
    component: C,
    props: MaybeRefOrGetter<ComponentProps<C>>,
  ) => Promise<DialogReturn<C>>;
  shownDialogs: Ref<Array<DialogInfo>>;
  closeDialog: (dialogId: number) => void;
}>;

let id = 1;

export function provideDialogSystem() {
  const shownDialogs = shallowRef<Array<DialogInfo>>([]);

  function show<C extends DialogConstructor>(
    component: C,
    props: MaybeRefOrGetter<ComponentProps<C>>,
  ): Promise<DialogReturn<C>> {
    return new Promise<DialogReturn<C>>((resolve) => {
      shownDialogs.value = [
        ...shownDialogs.value,
        { component: markRaw(component), props, id: ++id, resolve },
      ];
    });
  }

  function closeDialog(dialogId: number) {
    shownDialogs.value = shownDialogs.value.filter((dialog) => dialog.id !== dialogId);
  }

  provide(dialogSystemInjectionKey, { show, shownDialogs, closeDialog });
}

export function injectDialogSystem() {
  const dialogSystem = inject(dialogSystemInjectionKey);
  if (!dialogSystem) {
    throw new Error('Dialog system not provided');
  }
  return dialogSystem;
}
