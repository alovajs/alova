<template>
  <div>
    <span role="status"> {{ getStatusText }} </span>
    <span role="data">{{ data }}</span>
    <span role="onopen">{{ onOpenCounter }}</span>
    <span role="onerror">{{ onErrorCounter }}</span>
    <span role="onmessage">{{ onMessageCounter }}</span>
    <button
      role="send"
      @click="send">
      send request
    </button>
    <button
      role="close"
      @click="close">
      close request
    </button>
  </div>
</template>

<script setup lang="ts">
import { useSSE } from '@/index';
import VueHook from '@/statesHook/vue';
import { createAlova } from 'alova';
import GlobalFetch from 'alova/fetch';
import { computed, ref } from 'vue';

const props = defineProps<{
  baseURL?: string;
  immediate?: boolean;
  initialData?: any;
  port?: number;
  path: string;
}>();

const alovaInst = createAlova({
  baseURL: props.baseURL ?? `http://127.0.0.1:${props.port}`,
  statesHook: VueHook,
  requestAdapter: GlobalFetch(),
  cacheLogger: false
});

const onOpenCounter = ref(0);
const onErrorCounter = ref(0);
const onMessageCounter = ref(0);

const poster = (data: any) => alovaInst.Get(props.path, data);
const { onMessage, onOpen, onError, data, readyState, send, close } = useSSE(poster, {
  initialData: props.initialData,
  immediate: props.immediate
});

onMessage(e => {
  onMessageCounter.value += 1;
});

onOpen(() => {
  onOpenCounter.value += 1;
});

onError(() => {
  onErrorCounter.value += 1;
});

const getStatusText = computed(() => {
  if (readyState.value === 1 /** Sse hook ready state.open */) {
    return 'opened';
  } else if (readyState.value === 2 /** Sse hook ready state.closed */) {
    return 'closed';
  } else {
    return 'connecting';
  }
});
</script>
