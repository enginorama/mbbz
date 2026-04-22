<script setup lang="ts">
import { useConnection } from '@/connections/ExConnection';
import { useExStationOutputBus } from '@/connections/ExEventBus';
import { useConnectionLogger } from '@/connections/useConnectionLogger';
import PageTitle from '@/core/components/PageTitle.vue';
import Button from '@/core/components/ui/button/Button.vue';
import Checkbox from '@/core/components/ui/checkbox/Checkbox.vue';
import Input from '@/core/components/ui/input/Input.vue';
import { ArrowBigLeftDashIcon, ArrowBigRightDashIcon, InfoIcon, SendIcon } from 'lucide-vue-next';
import { nextTick, onMounted, ref, useTemplateRef, watch } from 'vue';

const outputBus = useExStationOutputBus();

const { logMessages } = useConnectionLogger();

const scrollAnchorRef = useTemplateRef<HTMLElement>('scrollAnchor');
const autoScrollEnabled = ref(true);

const { connected } = useConnection();

const messageToSend = ref('');

function send() {
  if (!connected.value) {
    return;
  }
  if (messageToSend.value.trim() === '') {
    return;
  }
  outputBus.emit(messageToSend.value.trim());
  messageToSend.value = '';
}

watch(
  () => [logMessages.value, autoScrollEnabled.value],
  async () => {
    if (!autoScrollEnabled.value) {
      return;
    }
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
    <div class="mt-6">
      <div class="mb-2 flex gap-2">
        <Input
          type="text"
          v-model="messageToSend"
          placeholder="Type message to send to DCC, e.g. <s>"
          class="input input-bordered w-full"
          :class="{
            'focus-visible:ring-destructive/20 focus-visible:border-destructive/50': !connected,
          }"
          @keyup.enter="send"
        />
        <Button @click="send" :disabled="!connected"><SendIcon />{{ $t('globals.send') }}</Button>
      </div>
      <div class="flex items-center gap-3">
        <Checkbox id="autoscroll" v-model="autoScrollEnabled" />
        <Label for="autoscroll">Auto scroll</Label>
      </div>
    </div>
  </div>
</template>
