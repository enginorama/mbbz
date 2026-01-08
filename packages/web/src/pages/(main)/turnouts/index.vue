<script setup lang="ts">
import type { TurnoutEntry } from '@/commandstation/CommandStation';
import { useCommandStation } from '@/commandstation/useCommandStation';
import PageTitle from '@/core/components/PageTitle.vue';
import Button from '@/core/components/ui/button/Button.vue';
import Card from '@/core/components/ui/card/Card.vue';
import CardContent from '@/core/components/ui/card/CardContent.vue';
import CardHeader from '@/core/components/ui/card/CardHeader.vue';
import CardTitle from '@/core/components/ui/card/CardTitle.vue';
import Item from '@/core/components/ui/item/Item.vue';
import { RefreshCwIcon } from 'lucide-vue-next';
import { ref } from 'vue';

const cs = useCommandStation();
const turnouts = ref<Array<TurnoutEntry>>([]);

async function refresh() {
  turnouts.value = await cs.getTurnoutEntries();
}
</script>

<template>
  <div>
    <PageTitle title="Turnouts" subtitle="Manage your track switches" />
    <Item variant="muted" class="mb-4 flex items-center justify-between gap-4">
      <div class="flex items-center gap-2"></div>
      <div class="flex gap-2">
        <Button @click="refresh"><RefreshCwIcon /></Button>
      </div>
    </Item>
    <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <Card v-for="turnout in turnouts" :key="turnout.id">
        <CardHeader>
          <CardTitle
            >{{ turnout.name }} <span class="opacity-45">(#{{ turnout.id }})</span></CardTitle
          >
        </CardHeader>
        <CardContent>{{ turnout.status }} </CardContent>
      </Card>
    </div>
  </div>
</template>
