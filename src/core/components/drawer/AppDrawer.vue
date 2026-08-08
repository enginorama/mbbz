<script setup lang="ts">
import {
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
    title?: string;
    description?: string;
    dismissible?: boolean;
    teleport?: boolean;
  }>(),
  {
    dismissible: true,
    teleport: true,
  },
);

const emit = defineEmits<{
  closed: [];
}>();

function handleContentAnimationEnd(event: AnimationEvent) {
  const target = event.target as HTMLElement;
  if (target === event.currentTarget && target.dataset.state === 'closed') {
    emit('closed');
  }
}

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
    <DrawerPortal :disabled="!teleport">
      <DrawerOverlay class="DrawerOverlay fixed inset-0 z-30 bg-black/40" />
      <DrawerContent
        class="DrawerContent fixed inset-x-0 bottom-0 z-100 mx-auto flex max-h-[80vh] max-w-125 flex-col overflow-auto rounded-t-2xl bg-white outline-none"
        @pointer-down-outside="handlePointerDownOutside"
        @animationend="handleContentAnimationEnd"
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
            {{ title }}
          </DrawerTitle>
          <DrawerDescription class="text-mauve11 mt-2.5 mb-5 text-sm leading-normal">
            {{ description }}
          </DrawerDescription>
          <slot></slot>
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

.DrawerContent {
  padding-bottom: var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px));
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
