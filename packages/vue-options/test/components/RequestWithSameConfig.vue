<template>
  <div>
    <span role="loading1">{{ testRequest1.loading ? 'loading' : 'loaded' }}</span>
    <div role="data1">{{ JSON.stringify(testRequest1.data) }}</div>
    <span role="loading2">{{ testRequest2.loading ? 'loading' : 'loaded' }}</span>
    <div role="data2">{{ JSON.stringify(testRequest2.data) }}</div>
  </div>
</template>

<script>
import { useRequest } from 'alova';
import { mapAlovaHook } from '../../src';

export default {
  props: {
    method: {
      type: Object,
      required: true
    }
  },
  mixins: mapAlovaHook(function () {
    const config = {
      initialData: {}
    };
    return {
      testRequest1: useRequest(this.method, config),
      testRequest2: useRequest(this.method, config)
    };
  })
};
</script>
