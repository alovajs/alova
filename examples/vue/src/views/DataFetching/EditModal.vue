<template>
  <h3 slot="header">Now close modal, and reopen this item, it will hit response cache, and wouldn't send request.</h3>
  <div>
    <nord-spinner v-if="loading" />
    <div
      v-else
      class="grid gap-4 text-base">
      <nord-banner>From cache: {{ fromCache ? 'Yes' : 'No' }}</nord-banner>
      <span>Name: {{ detail.name }}</span>
      <span>Class: {{ detail.cls }}</span>
    </div>
  </div>
</template>

<script setup>
import { useRequest } from 'alova/client';
import { ref } from 'vue';
import { queryStudentDetail } from '../../api/methods';

const props = defineProps({
  id: {
    type: Number,
    required: true
  }
});

const fromCache = ref(false);
const { loading, data: detail } = useRequest(() => queryStudentDetail(props.id), {
  initialData: {}
}).onSuccess(event => {
  fromCache.value = event.fromCache;
});
</script>
