<script setup lang="ts">
import { useWebSocketTransport } from '@/connections/transports/websocket/useWebSocketTransport';
import Button from '@/core/components/ui/button/Button.vue';
import Card from '@/core/components/ui/card/Card.vue';
import CardContent from '@/core/components/ui/card/CardContent.vue';
import CardHeader from '@/core/components/ui/card/CardHeader.vue';
import CardTitle from '@/core/components/ui/card/CardTitle.vue';
import Input from '@/core/components/ui/input/Input.vue';
import Item from '@/core/components/ui/item/Item.vue';
import ItemContent from '@/core/components/ui/item/ItemContent.vue';
import ItemTitle from '@/core/components/ui/item/ItemTitle.vue';
import { TriangleAlertIcon } from '@lucide/vue';

const websocketAddress = defineModel<string>('websocketAddress', { required: true });

const {
  connect: connectWebSocket,
  disconnect: disconnectWebSocket,
  isConnected: isWebSocketConnected,
  isConnecting: isWebSocketConnecting,
} = useWebSocketTransport();

const connectWebSocketHandler = () => {
  connectWebSocket(websocketAddress.value);
};
</script>

<template>
  <Card class="max-w-120">
    <CardHeader>
      <CardTitle>WebSocket Connection</CardTitle>
    </CardHeader>
    <CardContent>
      <Input
        class="mb-4"
        v-model="websocketAddress"
        :disabled="isWebSocketConnecting || isWebSocketConnected"
      />
      <Button
        @click="connectWebSocketHandler"
        v-if="!isWebSocketConnected"
        :disabled="isWebSocketConnecting"
      >
        Connect to WebSocket Server
      </Button>
      <Button @click="disconnectWebSocket" v-if="isWebSocketConnected" variant="outline">
        Disconnect from WebSocket Server
      </Button>
      <Item>
        <ItemContent>
          <ItemTitle><TriangleAlertIcon />Note</ItemTitle>
          <div>
            If you access this page online, you will most likely not be able to connect to your
            local command station because of browser security restrictions.
          </div>
          <div>Right now, this is only for local testing.</div>
        </ItemContent>
      </Item>
    </CardContent>
  </Card>
</template>
