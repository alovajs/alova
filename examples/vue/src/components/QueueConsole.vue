<template>
  <nord-card>
    <label
      slot="header"
      class="text-lg font-bold mr-2"
      >Network Mode</label
    >
    <nord-select
      slot="header-end"
      :value="networkMode"
      hide-label
      @input="handleModeChange">
      <option :value="0">Silent Request</option>
      <option :value="1">Normal Request</option>
    </nord-select>
    <div class="border-b-[1px] last:border-b-0 pb-4 border-slate-200">
      <div>
        <div class="text-base font-semibold mb-2">
          Background Request Queue[{{ defaultWaitingSilentQueue.queueName }}]
        </div>
        <div class="grid gap-y-4">
          <div
            v-for="(sm, i) in defaultWaitingSilentQueue.queue"
            :key="sm.id"
            class="border-2 border-slate-200 rounded-md px-3 py-2 flex items-center justify-between">
            <div
              v-if="!silentRequestError || i > 0"
              class="flex items-center">
              <div class="mr-1">
                <div
                  v-if="i > 0"
                  class="bg-amber-400 w-2 h-2 rounded-lg"></div>
                <nord-spinner v-else />
              </div>
              <span>{{ i > 0 ? 'waiting' : 'acting' }}</span>
            </div>
            <div
              v-else
              class="flex items-center">
              <div class="text-red-600 mr-1">×</div>
              Request Error
            </div>
            <span>[{{ sm.entity.type }}]{{ sm.entity.url }}</span>
          </div>
        </div>
      </div>
    </div>
  </nord-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { onSilentSubmitError, onSilentSubmitFail, silentQueueMap } from 'alova/client';
import { showToast } from '../helper';

const props = defineProps({
  queueName: {
    type: String,
    required: true
  },
  onModeChange: {
    type: Function,
    required: true
  }
});

const networkMode = ref(0);
const silentRequestError = ref('');
const defaultWaitingSilentQueue = ref({ queue: [], queueName: props.queueName });

const useWaitingSilentQueue = queueName => {
  const customQueue = [];
  const originalPush = customQueue.push;
  const originalShift = customQueue.shift;

  customQueue.push = function (...items) {
    defaultWaitingSilentQueue.value.queue.push(...items);
    return originalPush.call(this, ...items);
  };

  customQueue.shift = function () {
    const silentMethodInstance = originalShift.call(this);
    defaultWaitingSilentQueue.value.queue.shift();
    return silentMethodInstance;
  };

  silentQueueMap[queueName] = customQueue;
};

const handleModeChange = event => {
  const value = Number(event.target.value);
  networkMode.value = value;
  props.onModeChange(value);
};

onMounted(() => {
  useWaitingSilentQueue(props.queueName);

  const offSubmitError = onSilentSubmitError(event => {
    console.error(event.error);
    showToast(
      `Request Error: ${event.error}` + (event.retryDelay ? `, ${event.retryDelay / 1000}s after will retry` : ''),
      {
        variant: 'error'
      }
    );
  });

  const offSubmitFail = onSilentSubmitFail(event => {
    silentRequestError.value = event.error;
    showToast('Reach max retry times, but you can still operate it', {
      variant: 'error'
    });
  });

  props.onModeChange(networkMode.value);

  onUnmounted(() => {
    offSubmitError();
    offSubmitFail();
  });
});
</script>
