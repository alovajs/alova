<template>
  <view class="content">
    <image class="logo" src="/static/logo.png" />
    <view class="text-area">
      <text class="title">{{ title }}</text>
    </view>
    <text>{{ loading ? '加载中...' : JSON.stringify(data) }}</text>
    <view>错误：{{ error }}</view>
    <button @click="handleNav">跳转到nvue</button>
  </view>
</template>

<script setup lang="ts">
import { userinfo, detail } from '@/apis';
import { useRequest, useWatcher } from 'alova/client';
import { ref, watchEffect } from 'vue'

const title = ref('Hello')
const { loading, data, error, send } = useWatcher(params => {
  console.log('接收到params: ', params);
  return detail();
}, [title], {
  immediate: false
}).onError(res => {
  console.error('error', res.error.stack)
})

setTimeout(() => {
  send(123);
}, 1000);

// detail().then(res => {
//   console.log('res', res)
// })

const handleNav = () => {
  uni.navigateTo({
    url: '/pages/nvuepage/index'
  })
}
</script>

<style>
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.logo {
  height: 200rpx;
  width: 200rpx;
  margin-top: 200rpx;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 50rpx;
}

.text-area {
  display: flex;
  justify-content: center;
}

.title {
  font-size: 36rpx;
  color: #8f8f94;
}
</style>
