<template>
  <nord-card>
    <h3 slot="header">[{{ id }}] {{ title }}</h3>
    <div class="grid gap-y-4">
      <div class="flex justify-between">
        <nord-button
          variant="primary"
          :loading="loading"
          @click="handleSend">
          Start request
        </nord-button>
        <nord-button
          v-if="stopManually && loading"
          @click="stop"
          >Stop manually</nord-button
        >
      </div>

      <nord-banner
        v-if="error"
        class="alert"
        variant="danger">
        <div class="flex flex-col">
          <strong>Error Info</strong>
        </div>
        <span>{{ error.message }}</span>
      </nord-banner>

      <nord-banner
        v-if="retryMsgs.length > 0"
        variant="warning">
        <div class="flex flex-col">
          <strong>Retry Info</strong>
        </div>
        <div class="flex flex-col leading-6">
          <span
            v-for="msg in retryMsgs"
            :key="msg"
            >{{ msg }}</span
          >
        </div>
      </nord-banner>

      <nord-banner
        v-if="data"
        variant="success">
        <div class="flex flex-col">
          <strong>Request Success</strong>
        </div>
        <span>Response is: {{ JSON.stringify(data) }}</span>
      </nord-banner>
    </div>
  </nord-card>
</template>

<script setup>
import { useRetriableRequest } from 'alova/client';
import { ref } from 'vue';
import { getRetryData } from '../../api/methods';
import { formatDate } from '../../helper';

const props = defineProps({
  id: {
    type: String,
    required: true
  }
});

const retryTypes = {
  a: {
    title: 'Success after retry 2 times',
    retry: 3,
    backoff: {
      delay: 1000,
      multiplier: 1,
      startQuiver: 0,
      endQuiver: 0
    },
    apiErrorTimes: 2,
    stopManually: false
  },
  b: {
    title: 'Still fail after reaching a maximum of 5 times',
    retry: 5,
    backoff: {
      delay: 1000,
      multiplier: 1,
      startQuiver: 0,
      endQuiver: 0
    },
    apiErrorTimes: 10000,
    stopManually: false
  },
  c: {
    title: 'Retry time increases sequentially',
    retry: 3,
    backoff: {
      delay: 1000,
      multiplier: 2,
      startQuiver: 0,
      endQuiver: 0
    },
    apiErrorTimes: 3,
    stopManually: false
  },
  d: {
    title: 'Increase random retry time',
    retry: 3,
    backoff: {
      delay: 1000,
      multiplier: 1,
      startQuiver: 0.3,
      endQuiver: 0.6
    },
    apiErrorTimes: 3,
    stopManually: false
  },
  e: {
    title: 'Stop retrying manually',
    retry: 10000,
    backoff: {
      delay: 2000,
      multiplier: 1,
      startQuiver: 0,
      endQuiver: 0
    },
    apiErrorTimes: 10000,
    stopManually: true
  }
};

const { title, retry, backoff, apiErrorTimes: errTimes, stopManually } = retryTypes[props.id];
const retryMsgs = ref([]);

const pushMsg = msg => {
  retryMsgs.value.push(`[${formatDate(new Date())}] ${msg}`);
};

const { data, loading, error, send, stop } = useRetriableRequest(() => getRetryData({ id: props.id, errTimes }), {
  immediate: false,
  retry,
  backoff
})
  .onError(() => {
    pushMsg('Request error, Waiting for next retry');
  })
  .onRetry(event => {
    const numSuffix = ['', 'st', 'nd', 'rd'];
    pushMsg(
      `Delayed ${event.retryDelay / 1000} seconds, in the ${event.retryTimes}${numSuffix[event.retryTimes] || 'th'} retrying...`
    );
  })
  .onFail(event => {
    if (event.error.message.includes('manually')) {
      pushMsg('Stopped manually');
      return;
    }
    pushMsg(`Reached maximum retry times of ${event.retryTimes}, retry failed`);
  });

const handleSend = () => {
  retryMsgs.value = [];
  send().catch(() => {});
};
</script>
