import {
  inject,
  provide,
  ref,
  shallowReactive,
  toRaw,
  type Component,
  type InjectionKey,
  type MaybeRefOrGetter,
} from 'vue';
import type { ComponentProps } from 'vue-component-type-helpers';

const APP_SHEET_INJECT_KEY = Symbol() as InjectionKey<UseAppSheetReturn>;

export type DialogComponentReturnValue<T extends Component> = Parameters<
  NonNullable<ComponentProps<T>['onUpdate:value']>
>[0];

type UseAppSheetReturn = {
  show<T extends Component>(
    component: T,
    attrs: ComponentProps<T>,
  ): Promise<DialogComponentReturnValue<T> | undefined>;
};

export type SheetConfiguration = {
  id: symbol;
  component: Component;
  props: MaybeRefOrGetter<Record<string, unknown>>;
  setValue: (value: unknown) => void;
  onClose: () => void;
};

export function useAppSheet(): UseAppSheetReturn {
  const injected = inject(APP_SHEET_INJECT_KEY);
  if (!injected) throw new Error(`failed to inject ${APP_SHEET_INJECT_KEY.toString()}`);
  return injected;
}

export function provideAppSheet() {
  const stack = shallowReactive<SheetConfiguration[]>([]);

  function show<C extends Component>(
    component: C,
    props: MaybeRefOrGetter<ComponentProps<C>>,
  ): Promise<DialogComponentReturnValue<C> | undefined> {
    const id = Symbol('arac');

    const pendingResolves: ((value: unknown) => void)[] = [];
    const resolvePromise = new Promise<DialogComponentReturnValue<C> | undefined>((resolve) => {
      pendingResolves.push(resolve as (value: unknown) => void);
    });

    const lastValue = ref<unknown>(undefined);

    const setValue = (value: unknown) => {
      lastValue.value = value;
    };

    stack.push({
      id,
      component,
      props: props as MaybeRefOrGetter<Record<string, unknown>>,
      setValue,
      onClose: () => {
        pendingResolves.forEach((resolve) => resolve(toRaw(lastValue.value)));
        pendingResolves.length = 0;
      },
    });

    return resolvePromise;
  }

  const remove = (sheet: SheetConfiguration) => {
    const i = stack.findIndex((e) => e.id === sheet.id);
    if (i > -1) stack.splice(i, 1);
  };

  provide(APP_SHEET_INJECT_KEY, { show });

  return { stack, remove, show };
}
