<script setup lang="ts">
import { useConnection } from '@/connections/ExConnection';
import { useExStationOutputBus } from '@/connections/ExEventBus';
import { useConnectionLogger } from '@/connections/useConnectionLogger';
import PageTitle from '@/core/components/PageTitle.vue';
import Button from '@/core/components/ui/button/Button.vue';
import Input from '@/core/components/ui/input/Input.vue';
import { ArrowBigLeftDashIcon, ArrowBigRightDashIcon, InfoIcon, SendIcon } from 'lucide-vue-next';
import { nextTick, onMounted, useTemplateRef, watch } from 'vue';

const outputBus = useExStationOutputBus();

const { logMessages } = useConnectionLogger();

const scrollAnchorRef = useTemplateRef<HTMLElement>('scrollAnchor');

const { connected } = useConnection();

function send(event: KeyboardEvent) {
  if (!connected.value) {
    return;
  }
  const target = event.target as HTMLInputElement;
  const value = target.value;
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

onMounted(() => {
  scrollAnchorRef.value?.scrollIntoView();
});
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
    <PageTitle title="Logs" subtitle="Serial protocol" />
    <div class="w-full grow overflow-y-auto border border-gray-300 bg-gray-50 p-4">
      <div v-for="(msg, index) in logMessages" :key="index" class="mb-1 flex gap-2">
        <ArrowBigLeftDashIcon v-if="msg.type === 'OUT'" class="text-orange-500" />
        <ArrowBigRightDashIcon v-if="msg.type === 'IN'" class="text-blue-500" />
        <InfoIcon v-if="msg.type === 'INFO'" class="text-yellow-500" />
        <div>{{ msg.message }}</div>
      </div>
      <span ref="scrollAnchor"></span>
    </div>
    <div class="mb-4 flex gap-2 py-4">
      <Input
        type="text"
        placeholder="Type message to send to DCC"
        class="input input-bordered w-full"
        :class="{
          'focus-visible:ring-destructive/20 focus-visible:border-destructive/50': !connected,
        }"
        @keyup.enter="send"
      />
      <Button @click="send" :disabled="!connected"><SendIcon />Send</Button>
    </div>
  </div>
</template>
