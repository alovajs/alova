<template>
  <div>
    <div>
      {{ msgs }}
    </div>
    <div>{{ readyState }}</div>
    <nord-button @click="close">Close connection</nord-button>
  </div>
</template>

<script setup>
import { useSSE } from 'alova/client';
import { ref } from 'vue';
import { sseTest } from '../api/methods';

const msgs = ref([]);
const { data, onMessage, error, readyState, close } = useSSE(sseTest, {
  immediate: true,
  interceptByGlobalResponded: false
})
  .onMessage(({ data }) => {
    msgs.value.push(data);
  })
  .onError(err => {
    console.error('SSE error', err);
  });
</script>
