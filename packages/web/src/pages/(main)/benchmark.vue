<script setup lang="ts">
import { useCommandStation } from '@/commandstation/useCommandStation';
import PageLayout from '@/core/components/PageLayout.vue';
import Button from '@/core/components/ui/button/Button.vue';

const cs = useCommandStation();

async function startTest(): Promise<void> {
  const iterations = 50;
  console.log(`Starting test with ${iterations} loco commands...`);
  console.time(`${iterations} loco commands`);
  try {
    for (let i = 0; i < iterations; i++) {
      const ret = await cs.sendAndWaitForResponse({
        command: `<t 0 3 66 ${i % 2}>`,
        callback: (response) => {
          if (response.command === 'T') return true;
        },
        defaultValue: false,
      });
      if (ret === false) {
        throw new Error(`Did not receive response for command ${i}`);
      }
    }
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    console.timeEnd(`${iterations} loco commands`);
  }
}
</script>

<template>
  <PageLayout title="Test">
    <div class="flex flex-col gap-4">
      <Button @click="startTest">Test Button</Button>
    </div>
  </PageLayout>
</template>
