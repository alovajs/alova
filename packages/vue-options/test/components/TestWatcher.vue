<template>
  <div>
    <span role="loading">{{ testWatcher.loading ? 'loading' : 'loaded' }}</span>
    <span role="error">{{ testWatcher.error ? testWatcher.error.message : '' }}</span>
    <div role="data">{{ JSON.stringify(testWatcher.data) }}</div>
    <button
      role="btn1"
      @click="state1++"></button>
    <button
      role="btn2"
      @click="state2.v += 'a'"></button>
    <button
      @click="testWatcher$send"
      role="btnSend">
      send
    </button>
  </div>
</template>

<script>
import { useWatcher } from 'alova';
import { mapAlovaHook } from '../../src';

export default {
  props: {
    methodHandler: {
      type: Function,
      required: true
    },
    immediate: {
      type: Boolean,
      default: false
    }
  },
  mixins: mapAlovaHook(function () {
    return {
      testWatcher: useWatcher(() => this.methodHandler(this.state1, this.state2.v), ['state1', 'state2.v'], {
        immediate: this.immediate,
        initialData: {}
      })
    };
  }),
  data() {
    return {
      state1: 0,
      state2: {
        v: 'a'
      }
    };
  },
  emits: ['success', 'error', 'complete'],
  created() {
    this.testWatcher$onSuccess(event => {
      this.$emit('success', event);
    });
    this.testWatcher$onError(event => {
      this.$emit('error', event);
    });
  },
  mounted() {
    this.testWatcher$onComplete(event => {
      this.$emit('complete', event);
    });
  }
};
</script>
