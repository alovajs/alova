<template>
  <nord-card>
    <div class="grid gap-y-4">
      <nord-button
        @click="send"
        variant="primary"
        :loading="loading || undefined">
        Start serial request
      </nord-button>
      <nord-banner
        v-if="msgs.length > 0"
        variant="warning">
        <div class="flex flex-col">
          <strong>Serial Request Info</strong>
        </div>
        <div class="flex flex-col leading-6">
          <span
            v-for="msg in msgs"
            :key="msg"
            >{{ msg }}</span
          >
        </div>
      </nord-banner>
    </div>
  </nord-card>
</template>

<script setup>
import { useSerialRequest } from 'alova/client';
import { ref } from 'vue';
import { getData, submitForm } from '../api/methods';

// 使用ref声明响应式变量
const msgs = ref([]);

// 使用useSerialRequest处理串行请求
const { loading, send } = useSerialRequest(
  [
    () => getData(),
    fruits => {
      msgs.value = [`Request 1 success, Response is: ${JSON.stringify(fruits)}`];
      return submitForm(fruits);
    }
  ],
  {
    immediate: false
  }
).onSuccess(({ data }) => {
  msgs.value.push(`Request 2 success, Response is: ${JSON.stringify(data)}`);
});
</script>
