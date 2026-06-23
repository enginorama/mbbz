<script setup lang="ts">
import { useExNativeInputBus, useExStationOutputBus } from '@/connections/ExEventBus';
import PageLayout from '@/core/components/PageLayout.vue';
import Button from '@/core/components/ui/button/Button.vue';
import { MessageCircleQuestionIcon, PauseIcon, PlayIcon } from '@lucide/vue';
import { onUnmounted, ref } from 'vue';

const { emit } = useExStationOutputBus();
const inputBus = useExNativeInputBus();

const messages = ref<string[]>([]);

const stopListening = inputBus.on((packet) => {
  if (packet.command === '*') {
    const [subCommand, ...params] = packet.params;
    if (subCommand === 'EXRAIL') {
      messages.value = [...messages.value.slice(-299), `${params.join(' ')}`];
      console.log('Received status update:', params);
    }
  }
});

onUnmounted(() => {
  stopListening();
});

function pause(): void {
  emit('</ PAUSE>');
}

function resume(): void {
  emit('</ RESUME>');
}

function requestStatus(): void {
  emit('</>');
}
</script>

<template>
  <PageLayout title="EXRAIL" subtitle="Automations on your layout">
    <div class="flex flex-wrap gap-4">
      <Button @click="pause"><PauseIcon></PauseIcon>Pause</Button>
      <Button @click="resume"><PlayIcon></PlayIcon>Resume</Button>
      <Button @click="requestStatus">
        <MessageCircleQuestionIcon></MessageCircleQuestionIcon> Status
      </Button>
    </div>
    <div class="mt-4 h-64 overflow-y-auto rounded bg-gray-100 p-4">
      <ul>
        <li v-for="(message, index) in messages" :key="index">{{ message }}</li>
      </ul>
      <span ref="scrollAnchor"></span>
    </div>
  </PageLayout>
</template>
