<script setup lang="ts">
import { rawInputBus, rawOutputBus } from '@/connections/connections';
import PageTitle from '@/core/components/PageTitle.vue';
import Input from '@/core/components/ui/input/Input.vue';
import { useEventBus } from '@vueuse/core';
import { nextTick, shallowRef, useTemplateRef, watch } from 'vue';

const inputBus = useEventBus<string>(rawInputBus);
const outputBus = useEventBus<string>(rawOutputBus);

const logMessages = shallowRef<string[]>([]);

const scrollAnchorRef = useTemplateRef<HTMLElement>('scrollAnchor');

function logMessage(message: string) {
  logMessages.value = [...logMessages.value.slice(-99), message];
}

inputBus.on((data) => {
  logMessage(`IN: ${data}`);
});

function send(event: KeyboardEvent) {
  const target = event.target as HTMLInputElement;
  const value = target.value;
  logMessage(`OUT: ${value}`);
  outputBus.emit(value);
  target.value = '';
}

watch(
  () => logMessages.value,
  async () => {
    console.log('Scrolling to bottom');
    await nextTick();
    scrollAnchorRef.value?.scrollIntoView({ behavior: 'smooth' });
  },
  { deep: true },
);
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
    <PageTitle title="Log" />
    <div class="w-full grow overflow-y-auto border border-gray-300 bg-gray-50 p-4">
      <div v-for="(msg, index) in logMessages" :key="index" class="mb-1">
        {{ msg }}
      </div>
      <span ref="scrollAnchor"></span>
    </div>
    <div class="mb-4 py-4">
      <Input
        type="text"
        placeholder="Type message to send to DCC"
        class="input input-bordered w-full"
        @keyup.enter="send"
      />
    </div>
  </div>
</template>
