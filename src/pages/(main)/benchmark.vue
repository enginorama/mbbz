<script setup lang="ts">
import { ref } from 'vue';
import { useCommandStation } from '@/commandstation/useCommandStation';
import PageLayout from '@/core/components/PageLayout.vue';
import Button from '@/core/components/ui/button/Button.vue';
import Input from '@/core/components/ui/input/Input.vue';
import Label from '@/core/components/ui/label/Label.vue';

const cs = useCommandStation();

const locoAddress = ref(3);

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
      decode: (response) => {
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

interface SpeedResponse {
  speed: number;
  direction: 0 | 1;
}

function decodeSpeedAndDir(speedAndDir: number): SpeedResponse {
  let speed = (speedAndDir & 0x7f) - 1;
  if (speed < 0) speed = 0;
  const direction = (speedAndDir & 0x80) > 0 ? 1 : 0;
  return { speed, direction };
}

/**
 * Ramps a loco through every logical speed value 0-126 (the range the <t> command accepts) and
 * checks that the <l> broadcast echoes back the exact speed we asked for, rather than just
 * checking that some response arrived.
 */
async function startSpeedRampTest(): Promise<void> {
  const address = locoAddress.value;
  const direction = 1;
  const minSpeed = 0;
  const maxSpeed = 126;
  console.log(`Starting speed ramp test on loco ${address}...`);
  console.time('speed ramp test');

  // DCC-EX only broadcasts <l> when a loco's state actually changes, so if the loco is already
  // stopped in `direction` from a previous run, the first step below would get no response at
  // all. Force it into a differing state first so every step in the ramp causes a real change.
  await cs.sendAndWaitForResponse({
    command: `<t 0 ${address} 1 ${direction === 1 ? 0 : 1}>`,
    decode: (response) => {
      if (response.command === 'l' && Number(response.params[0]) === address) return true;
    },
    defaultValue: false,
  });

  const mismatches: Array<{ sent: number; expected: number; actual: SpeedResponse | null }> = [];
  const timings: Array<{ speed: number; elapsedMs: number }> = [];
  for (let speed = minSpeed; speed <= maxSpeed; speed++) {
    const expected = speed;
    const start = performance.now();
    const result = await cs.sendAndWaitForResponse<SpeedResponse | null>({
      command: `<t 0 ${address} ${speed} ${direction}>`,
      decode: (response) => {
        if (response.command === 'l' && Number(response.params[0]) === address) {
          return decodeSpeedAndDir(Number(response.params[2]));
        }
      },
      defaultValue: null,
    });
    timings.push({ speed, elapsedMs: performance.now() - start });
    if (result === null) {
      mismatches.push({ sent: speed, expected, actual: null });
      console.warn(`No response for speed ${speed}`);
    } else if (result.speed !== expected || result.direction !== direction) {
      mismatches.push({ sent: speed, expected, actual: result });
      console.warn(
        `Speed mismatch: sent ${speed}, expected ${expected}, got ${result.speed} (dir ${result.direction})`,
      );
    }
  }
  await cs.sendAndWaitForResponse({
    command: `<t 0 ${address} 0 ${direction}>`,
    decode: (response) => {
      if (response.command === 'l' && Number(response.params[0]) === address) return true;
    },
    defaultValue: false,
  });
  console.timeEnd('speed ramp test');
  const tested = maxSpeed - minSpeed + 1;
  console.log(`${mismatches.length}/${tested} speed steps mismatched:`, mismatches);

  const elapsedValues = timings.map((t) => t.elapsedMs);
  const totalElapsed = elapsedValues.reduce((sum, v) => sum + v, 0);
  console.log(
    `Per-command response time: min ${Math.min(...elapsedValues).toFixed(0)}ms, ` +
      `max ${Math.max(...elapsedValues).toFixed(0)}ms, ` +
      `avg ${(totalElapsed / elapsedValues.length).toFixed(0)}ms ` +
      `(includes queue wait time, not just wire latency)`,
  );
  console.table(timings.map((t) => ({ speed: t.speed, elapsedMs: t.elapsedMs.toFixed(1) })));
}
</script>

<template>
  <PageLayout title="Benchmark">
    <div class="flex flex-col gap-4">
      <Button @click="startTest">Latency Test</Button>

      <div class="flex items-end gap-2">
        <div class="flex flex-col gap-1">
          <Label for="loco-address">Loco address</Label>
          <Input id="loco-address" v-model.number="locoAddress" type="number" class="w-24" />
        </div>
        <Button @click="startSpeedRampTest">Speed Ramp Test</Button>
      </div>
    </div>
  </PageLayout>
</template>
