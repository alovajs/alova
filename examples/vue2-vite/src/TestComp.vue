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
	</div>
</template>

<script>
import { useRequest } from 'alova';
import { mapAlovaHook } from '@alova/vue-options';
import { getData } from './api';

export default {
	mixins: mapAlovaHook(function () {
		return {
			testRequest: useRequest(getData, {
        immediate: false
      })
		};
	}),
  data() {
    return {
      a: 1,
      b: 2
    }
  },
  setup() {
    return {
      cc: 2,
      dd: 4
    }
  },
	created() {
    this.a
    this.cc
    this.dd
    this.testRequest.uploading.loaded
    this.testRequest.data
    this.testRequest$send()
    this.testRequest$onSuccess(event => {
      event.data.match
      event.sendArgs.copyWithin
    })
		this.testRequest$onSuccess(event => {
			console.log('success', event);
		});
		this.testRequest$onError(event => {
			console.log('error', event);
		});
	},
	mounted() {
    this.a
		this.testRequest$onComplete(event => {
			console.log('complete', event);
		});
	}
};
</script>
