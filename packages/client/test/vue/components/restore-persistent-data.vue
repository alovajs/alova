<template>
  <div>
    <span role="isSuccess">isSuccess_{{ isSuccess }}</span>
    <span role="isRestore">isRestore_{{ isRestore }}</span>
    <span role="form">{{ JSON.stringify(form) }}</span>
    <span role="data">{{ JSON.stringify(data) }}</span>
  </div>
</template>

<script setup lang="ts">
import { useForm } from '@/index';
import { createAlova } from 'alova';
import VueHook from '@/statesHook/vue';
import { ref } from 'vue';
import { mockRequestAdapter } from '~/test/mockData';

const alovaInst = createAlova({
  baseURL: 'http://localhost:8080',
  statesHook: VueHook,
  requestAdapter: mockRequestAdapter,
  cacheLogger: false
});

const poster = (data: any) => alovaInst.Post('/saveData?d=2', data);
const { form, onSuccess, onRestore, data } = useForm(poster, {
  initialForm: {
    name: '',
    age: ''
  },
  store: true,
  resetAfterSubmiting: true,
  immediate: true
});
const isRestore = ref(0);
onRestore(() => {
  isRestore.value = 1;
});

const isSuccess = ref(0);
onSuccess(() => {
  isSuccess.value = 1;
});
</script>
