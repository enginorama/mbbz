<script setup lang="ts">
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerOverlay,
  DrawerPortal,
  DrawerRoot,
  DrawerTitle,
  type PointerDownOutsideEvent,
} from 'reka-ui';

const props = withDefaults(
  defineProps<{
    dismissible?: boolean;
  }>(),
  {
    dismissible: true,
  },
);

function handlePointerDownOutside(event: PointerDownOutsideEvent) {
  if (!props.dismissible) {
    event.preventDefault();
  }
}

function handlePointerOrTouchDown(event: PointerEvent | TouchEvent) {
  if (!props.dismissible) {
    event.stopPropagation();
  }
  const target = event.target as HTMLElement;
  if (target.closest('[data-no-swipe]')) {
    event.stopPropagation();
  }
}
</script>

<template>
  <DrawerRoot>
    <DrawerPortal>
      <DrawerOverlay class="DrawerOverlay fixed inset-0 z-30 bg-black/40" />
      <DrawerContent
        class="DrawerContent fixed inset-x-0 bottom-0 z-[100] mx-auto flex max-h-[80vh] max-w-[500px] flex-col overflow-auto rounded-t-[16px] bg-white outline-none"
        @pointer-down-outside="handlePointerDownOutside"
      >
        <DrawerHandle
          v-if="dismissible"
          class="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-black"
        />
        <div
          class="overflow-auto p-6"
          @pointerdown="handlePointerOrTouchDown"
          @touchstart="handlePointerOrTouchDown"
        >
          <DrawerTitle class="text-mauve12 m-0 text-[17px] font-semibold">
            Edit profile
          </DrawerTitle>
          <DrawerDescription class="text-mauve11 mt-[10px] mb-5 text-sm leading-normal">
            Make changes to your profile here. Swipe down or click close when you're done.
          </DrawerDescription>
          <DrawerDescription
            data-no-swipe
            class="text-mauve11 mt-[10px] mb-5 text-sm leading-normal"
          >
            Something so cool??
          </DrawerDescription>

          <fieldset class="mb-[15px] flex items-center gap-5">
            <label class="text-grass11 w-[90px] text-right text-sm" for="name"> Name </label>
            <input
              id="name"
              class="text-grass11 shadow-green7 focus:shadow-green8 inline-flex h-[35px] w-full flex-1 items-center justify-center rounded-lg bg-stone-50 px-[10px] text-sm leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
              value="Pedro Duarte"
            />
          </fieldset>
          <div class="mt-[25px] flex justify-end">
            <DrawerClose as-child>
              <button
                class="bg-green4 text-green11 hover:bg-green5 focus:shadow-green7 inline-flex h-[35px] items-center justify-center rounded-lg px-[15px] text-sm leading-none font-semibold focus:shadow-[0_0_0_2px] focus:outline-none"
              >
                Save changes
              </button>
            </DrawerClose>
          </div>
          <div class="overflow-auto">
            <div v-for="i in 30" :key="i">{{ i }}</div>
          </div>
        </div>
      </DrawerContent>
    </DrawerPortal>
  </DrawerRoot>
</template>

<style>
.DrawerOverlay[data-state='open'] {
  animation: drawer-overlay-in 450ms cubic-bezier(0.32, 0.72, 0, 1);
}
.DrawerOverlay[data-state='closed'] {
  animation: drawer-overlay-out 450ms cubic-bezier(0.32, 0.72, 0, 1);
}

.DrawerContent {
  /* `--drawer-swipe-movement-y` is written by DrawerContent while dragging. */
  transform: translateY(var(--drawer-swipe-movement-y, 0px));
  transition: transform 450ms cubic-bezier(0.32, 0.72, 0, 1);
  will-change: transform;
}
/* Enter/exit keyframes animate the independent `translate` property so they
   compose with the inline `transform` carrying the live drag offset. */
.DrawerContent[data-state='open'] {
  animation: drawer-slide-bottom-in 450ms cubic-bezier(0.32, 0.72, 0, 1);
}
.DrawerContent[data-state='closed'] {
  animation: drawer-slide-bottom-out 450ms cubic-bezier(0.32, 0.72, 0, 1);
}
/* Silence the transform transition during an active drag so it tracks the
   pointer in real time. */
.DrawerContent[data-swiping] {
  transition-duration: 0ms;
  user-select: none;
}

@keyframes drawer-overlay-in {
  from {
    opacity: 0;
  }
}
@keyframes drawer-overlay-out {
  to {
    opacity: 0;
  }
}
@keyframes drawer-slide-bottom-in {
  from {
    translate: 0 100%;
  }
}
@keyframes drawer-slide-bottom-out {
  to {
    translate: 0 100%;
  }
}
</style>
