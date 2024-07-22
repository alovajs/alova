<template>
  <div>
    <span role="loading">{{ testFetcher.loading ? 'fetching' : 'fetched' }}</span>
    <span role="error">{{ testFetcher.error ? testFetcher.error.message : '' }}</span>
    <div role="data">{{ JSON.stringify(fetchedData) }}</div>
    <button
      @click="handleFetch"
      role="btnFetch">
      fetch
    </button>
  </div>
</template>

<script>
import { mapAlovaHook } from '@/index';
import { useFetcher } from 'alova/client';

export default {
  props: {
    method: {
      type: Object,
      required: true
    },
    immediate: {
      type: Boolean,
      default: true
    }
  },
  mixins: mapAlovaHook(function () {
    return {
      testFetcher: useFetcher()
    };
  }),
  emits: ['success', 'error', 'complete'],
  data() {
    return {
      fetchedData: {}
    };
  },
  created() {
    this.testFetcher$onSuccess(event => {
      this.$emit('success', event);
    });
    this.testFetcher$onError(event => {
      this.$emit('error', event);
    });
  },
  mounted() {
    this.testFetcher$onComplete(event => {
      this.$emit('complete', event);
    });
  },
  methods: {
    async handleFetch() {
      this.fetchedData = await this.testFetcher$fetch(this.method);
    }
  }
};
</script>
