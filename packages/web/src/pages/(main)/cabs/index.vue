<script setup lang="ts">
import type { RosterEntry } from '@/commandstation/CommandStation';
import { useRosterStore } from '@/commandstation/roster/useRosterStore';
import { useCommandStation } from '@/commandstation/useCommandStation';
import PageTitle from '@/core/components/PageTitle.vue';
import Button from '@/core/components/ui/button/Button.vue';
import Card from '@/core/components/ui/card/Card.vue';
import CardContent from '@/core/components/ui/card/CardContent.vue';
import CardHeader from '@/core/components/ui/card/CardHeader.vue';
import CardTitle from '@/core/components/ui/card/CardTitle.vue';
import Empty from '@/core/components/ui/empty/Empty.vue';
import EmptyContent from '@/core/components/ui/empty/EmptyContent.vue';
import EmptyDescription from '@/core/components/ui/empty/EmptyDescription.vue';
import EmptyHeader from '@/core/components/ui/empty/EmptyHeader.vue';
import EmptyMedia from '@/core/components/ui/empty/EmptyMedia.vue';
import EmptyTitle from '@/core/components/ui/empty/EmptyTitle.vue';
import Table from '@/core/components/ui/table/Table.vue';
import TableBody from '@/core/components/ui/table/TableBody.vue';
import TableCell from '@/core/components/ui/table/TableCell.vue';
import TableHead from '@/core/components/ui/table/TableHead.vue';
import TableHeader from '@/core/components/ui/table/TableHeader.vue';
import TableRow from '@/core/components/ui/table/TableRow.vue';
import { FolderCode } from 'lucide-vue-next';
import { computed, ref } from 'vue';

const commandStation = useCommandStation();
const rosterStore = useRosterStore();

const entries = ref<Array<RosterEntry>>([]);

async function refresh() {
  entries.value = await commandStation.getRosterEntries();
  console.log('Roster entries:', entries.value);
  rosterStore.$patch({
    roster: new Map(entries.value.map((entry) => [entry.address, entry])),
  });
}

const cabs = computed(() => Array.from(rosterStore.roster.values()));
</script>

<template>
  <div>
    <PageTitle title="Cabs" subtitle="Manage your rolling stock" />
    <Card v-if="cabs.length > 0">
      <CardHeader>
        <CardTitle>Cabs</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableHead>Address</TableHead>
            <TableHead>Name</TableHead>
          </TableHeader>
          <TableBody>
            <TableRow v-for="data in cabs" :key="data.address">
              <TableCell>{{ data.address }}</TableCell>
              <TableCell>{{ data.name }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    <Empty v-else>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderCode />
        </EmptyMedia>
        <EmptyTitle>No Cabs Yet</EmptyTitle>
        <EmptyDescription>
          You haven't created any cabs yet. Get started by creating your first cab.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div class="flex gap-2">
          <Button>Create Cab</Button>
          <Button variant="outline" @click="refresh"> Load from CS </Button>
        </div>
      </EmptyContent>
    </Empty>
  </div>
</template>
