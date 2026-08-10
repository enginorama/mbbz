<script setup lang="ts">
import {
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
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

function handleQuickDismissAttempt(event: PointerDownOutsideEvent | KeyboardEvent) {
  if (!props.dismissible) {
    event.preventDefault();
  }
}

function handleContentAnimationEnd(event: AnimationEvent) {
  const target = event.target as HTMLElement;
  if (target === event.currentTarget && target.dataset.state === 'closed') {
    emit('closed');
  }
}
</script>

<template>
  <DialogRoot v-slot="{ close }">
    <DialogTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger"></slot>
    </DialogTrigger>
    <DialogPortal :disabled="!teleport">
      <DialogOverlay class="DialogOverlay fixed inset-0 z-30 bg-black/20" />
      <DialogContent
        class="DialogContent fixed top-[50%] left-[50%] z-100 max-h-[85vh] w-[90vw] max-w-112.5 translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-6.25 shadow-[hsl(206_22%_7%/35%)_0px_10px_38px_-10px,hsl(206_22%_7%/20%)_0px_10px_20px_-15px] focus:outline-none"
        @pointer-down-outside="handleQuickDismissAttempt"
        @escape-key-down="handleQuickDismissAttempt"
        @animationend="handleContentAnimationEnd"
      >
        <DialogTitle class="text-mauve12 m-0 text-[17px] font-semibold">
          {{ title }}
        </DialogTitle>
        <DialogDescription class="text-mauve11 mt-2.5 mb-5 text-sm leading-normal">
          {{ description }}
        </DialogDescription>
        <slot :close="close"></slot>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style>
.DialogOverlay[data-state='open'] {
  animation: overlay-show 150ms cubic-bezier(0.16, 1, 0.3, 1);
}
.DialogOverlay[data-state='closed'] {
  animation: overlay-hide 150ms cubic-bezier(0.16, 1, 0.3, 1);
}
.DialogContent[data-state='open'] {
  animation: content-show 150ms cubic-bezier(0.16, 1, 0.3, 1);
}
.DialogContent[data-state='closed'] {
  animation: content-hide 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes overlay-show {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes overlay-hide {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes content-show {
  from {
    opacity: 0;
    scale: 0.9;
  }
  to {
    opacity: 1;
    scale: 1;
  }
}

@keyframes content-hide {
  from {
    opacity: 1;
    scale: 1;
  }
  to {
    opacity: 0;
    scale: 0.9;
  }
}
</style>
