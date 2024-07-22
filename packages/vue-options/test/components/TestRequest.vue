<template>
  <div>
    <span role="loading">{{ testRequest.loading ? 'loading' : 'loaded' }}</span>
    <span role="error">{{ testRequest.error ? testRequest.error.message : '' }}</span>
    <div role="data">{{ JSON.stringify(testRequest.data) }}</div>
    <button
      @click="testRequest$send"
      role="btnSend">
      send
    </button>
    <span role="extraData">{{ testRequest.extraData }}</span>
    <span role="loadingComputed">{{ testRequest$loading ? 'loading' : 'loaded' }}</span>
    <div role="dataComputed">{{ JSON.stringify(testRequest$data) }}</div>
    <button
      role="btnModify"
      @click="handleTestRequest$dataModify">
      modify data
    </button>
  </div>
</template>

<script>
import { mapAlovaHook } from '@/index';
import { useRequest } from 'alova/client';

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
      testRequest: useRequest(this.method, {
        immediate: this.immediate,
        initialData: {},
        managedStates: {
          extraData: 1
        }
      })
    };
  }),
  emits: ['success', 'error', 'complete', 'watchState'],
  computed: {
    testRequest$loading() {
      return this.testRequest.loading;
    },
    testRequest$data: {
      get() {
        return this.testRequest.data;
      },
      set(v) {
        this.testRequest.data = v;
      }
    }
  },
  created() {
    this.testRequest$onSuccess(event => {
      this.$emit('success', event);
    });
    this.testRequest$onError(event => {
      this.$emit('error', event);
    });
  },
  mounted() {
    this.testRequest$onComplete(event => {
      this.$emit('complete', event);
    });
  },
  watch: {
    'testRequest.data'(newVal) {
      this.$emit('watchState', newVal, this);
    }
  },
  methods: {
    handleTestRequest$dataModify() {
      this.testRequest$data = { modify: true };
    }
  }
};
</script>
