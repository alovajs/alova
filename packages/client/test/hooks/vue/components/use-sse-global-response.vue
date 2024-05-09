<template>
  <div>
    <span role="status"> {{ getStatusText }} </span>
    <span role="data">{{ data }}</span>
    <span role="onopen">{{ onOpenCounter }}</span>
    <span role="onerror">{{ onErrorCounter }}</span>
    <span role="onmessage">{{ onMessageCounter }}</span>
    <span role="on-response">{{ mockResponseCounter }}</span>
    <span role="on-response-error">{{ mockResponseErrorCounter }}</span>
    <span role="on-response-complete">{{ mockResponseCompleteCounter }}</span>
    <button
      role="send"
      @click="() => send()">
      send request
    </button>
    <button
      role="send-to-not-exist"
      @click="sendError">
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
import VueHook from 'alova/vue';
import { computed, ref } from 'vue';
import { getAlovaInstance } from '~/test/utils';
import { useSSE } from '../..';

const props = defineProps<{
  baseURL?: string;
  immediate: boolean;
  initialData: any;
  port?: number;
  path: string;
  interceptByGlobalResponded: boolean;
}>();

const replacedData = 'replaced-data';
const dataReplaceMe = 'data-replace-me';

const dataThrowError = 'never-gonna-give-you-up';

const onOpenCounter = ref(0);
const onErrorCounter = ref(0);
const onMessageCounter = ref(0);

const mockResponseCounter = ref(0);
const mockResponseErrorCounter = ref(0);
const mockResponseCompleteCounter = ref(0);

const alovaInst = getAlovaInstance(VueHook, {
  baseURL: `http://127.0.0.1:${props.port}`,
  responseExpect: data => {
    mockResponseCounter.value += 1;
    if ((data as any) === dataReplaceMe) {
      return replacedData;
    }

    if ((data as any) === dataThrowError) {
      throw new Error('an error...');
    }

    return data;
  },
  resErrorExpect() {
    mockResponseErrorCounter.value += 1;
    return props.initialData;
  },
  resCompleteExpect() {
    mockResponseCompleteCounter.value += 1;
  }
});

const poster = (url = props.path) => alovaInst.Get(url);
const { onMessage, onOpen, onError, data, readyState, send, close } = useSSE(poster, {
  initialData: props.initialData,
  immediate: props.immediate,
  interceptByGlobalResponded: props.interceptByGlobalResponded
});

const sendError = () => {
  send('/not-exist-path');
};

onMessage(() => {
  onMessageCounter.value += 1;
});

onOpen(() => {
  onOpenCounter.value += 1;
});

onError(() => {
  onErrorCounter.value += 1;
});

const getStatusText = computed(() => {
  if (readyState.value === 1 /** SSEHookReadyState.OPEN */) {
    return 'opened';
  } else if (readyState.value === 2 /** SSEHookReadyState.CLOSED */) {
    return 'closed';
  } else {
    return 'connecting';
  }
});
</script>
