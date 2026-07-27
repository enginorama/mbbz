<script setup lang="ts">
import { useCommandStation } from '@/commandstation/useCommandStation';
import PageLayout from '@/core/components/PageLayout.vue';
import Button from '@/core/components/ui/button/Button.vue';

const cs = useCommandStation();

async function startTest(): Promise<void> {
  const iterations = 200;
  console.log(`Starting test with ${iterations} loco commands...`);
  console.time(`${iterations} loco commands`);
  const failures: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const direction = `${i % 2}`;
    const start = performance.now();
    const ret = await cs.sendAndWaitForResponse({
      command: `<t 0 3 66 ${direction}>`,
      callback: (response) => {
        // DCC-EX also broadcasts <l> spontaneously (independent of any command we sent), so
        // without checking the cab, a stray broadcast for a different loco can get consumed by
        // the wrong iteration's wait here, starving a later iteration of its real response.
        if (response.command === 'l' && response.params[0] === '3') return true;
      },
      defaultValue: false,
    });
    const elapsed = performance.now() - start;
    if (ret === false) {
      failures.push(i);
      console.warn(`Did not receive response for command ${i} (waited ${elapsed.toFixed(0)}ms)`);
    } else if (elapsed > 500) {
      console.warn(`Command ${i} took ${elapsed.toFixed(0)}ms`);
    }
  }
  console.timeEnd(`${iterations} loco commands`);
  console.log(`${failures.length}/${iterations} commands never got a response:`, failures);
}
</script>

<template>
  <PageLayout title="Benchmark">
    <div class="flex flex-col gap-4">
      <Button @click="startTest">Test Button</Button>
    </div>
  </PageLayout>
</template>
