<template>
  <div>
    <div>{{ asyncData }}</div>
    <!-- <span>{{ loading ? 'loading' : 'loaded' }}</span>
    <span>{{ data }}</span> -->
    <button @click="handleChange">改变</button>
    <NuxtWelcome />
  </div>
</template>

<script setup lang="ts">
import { getData } from './src/api';
import { useRequest, useWatcher } from 'alova/client';
import useRequestNuxt from './src/useRequestNuxt';

const aa = ref(1);
const { data: asyncData, status, refresh } = await useAsyncData(() => getData(aa.value).send());
console.log(asyncData.value, status.value);
const handleChange = () => {
  aa.value++;
  refresh();
}



// const { data, loading, error, send } = useWatcher(() => getData(aa.value), [aa], {
//   initialData: [],
//   immediate: true
// });
// const handleChange = () => {
//   aa.value++;
// }
// console.log(process);
// if (!process.client) {
//   send();
// }

// const { loading: pending, data, error, send } = useRequestNuxt(() => getData(aa.value));
// const handleChange = () => {
//   aa.value++;
//   send();
// }
</script>