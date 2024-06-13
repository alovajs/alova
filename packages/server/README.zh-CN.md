# @alova/adapter-axios

alova 的 axios 适配器

[![npm](https://img.shields.io/npm/v/@alova/adapter-axios)](https://www.npmjs.com/package/@alova/adapter-axios)
[![build](https://github.com/alovajs/adapter-axios/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/alovajs/adapter-axios/actions/workflows/main.yml)
[![coverage status](https://coveralls.io/repos/github/alovajs/adapter-axios/badge.svg?branch=main)](https://coveralls.io/github/alovajs/adapter-axios?branch=main)
![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

<p>中文 | <a href="./README.md">📑English</a></p>

[官网](https://alova.js.org/extension/alova-adapter-axios) | [核心库 alova](https://github.com/alovajs/alova)

## 使用方法

### 创建 alova

使用 **axiosRequestAdapter** 作为 alova 的请求适配器。

```javascript
import { createAlova } from 'alova';
import VueHook from 'alova/vue';
import { axiosRequestAdapter } from '@alova/adapter-axios';

const alovaInst = createAlova(
  baseURL: 'https://api.alovajs.org',
  statesHook: VueHook,
  // highlight-start
  requestAdapter: axiosResponseAdapter(),
  // highlight-end
);
```

### 请求

请求的使用方法与 web 环境中使用完全一致。已经完全兼容**axios**，你可以在创建 method 实例的*config*中指定`axios`支持的[全部配置项](https://axios-http.com/docs/req_config)

> 以 Vue 为例

```html
<tempate>
  <div v-if="loading">加载中...</div>
  <div>请求数据为：{{ data }}</div>
</tempate>

<script setup>
  const list = () =>
    alovaInst.Get('/list', {
      // 设置的参数将传递给axios
      paramsSerializer: params => {
        return Qs.stringify(params, { arrayFormat: 'brackets' });
      }
    });
  const { loading, data } = useRequest(list);
</script>
```

### 上传

使用`FormData`上传文件，这个`FormData`实例会被传递到 axios 中，与 axios 上传文件用法保持了一致。

```javascript
const uploadFile = imageFile => {
  const formData = new FormData();
  formData.append('file', imageFile);
  return alovaInst.Post('/uploadImg', formData, {
    // 开启上传进度
    enableUpload: true
  });
};

const {
  loading,
  data,
  uploading,
  send: sendUpload
} = useRequest(uploadFile, {
  immediate: false
});

// 图片选择事件回调
const handleImageChoose = ({ target }) => {
  sendUpload(target.files[0]);
};
```

### 下载

将请求 url 指向文件地址即可下载，你也可以通过将`enableDownload`设置为 true 来开启下载进度。

```javascript
const downloadFile = () =>
  alovaInst.Get('/bigImage.jpg', {
    // 开启下载进度
    enableDownload: true,
    responseType: 'blob'
  });

const { loading, data, downloading, send, onSuccess } = useRequest(downloadFile, {
  immediate: false
});
onSuccess(({ data: imageBlob }) => {
  // 下载图片
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = 'image.jpg';
  anchor.click();
  URL.revokeObjectURL(anchor.href);
});
const handleImageDownload = () => {
  send();
};
```

## 模拟请求适配器兼容

在开发应用时，我们仍然可能需要用到模拟请求。只是默认情况下，[模拟请求适配器(@alova/mock)](/extension/alova-mock)的响应数据是一个`Response`实例，即默认兼容`GlobalFetch`请求适配器，当使用 axios 适配器时，我们需要让模拟请求适配器的响应数据是**AxiosResponse**兼容的，错误实例是**AxiosError**，因此你需要使用**@alova/adapter-axios**包中导出的`axiosMockResponse`作为响应适配器。

```javascript
import { defineMock, createAlovaMockAdapter } from '@alova/mock';
import { axiosRequestAdapter, axiosMockResponse } from '@alova/adapter-axios';

const mocks = defineMock({
  // ...
});

// 模拟数据请求适配器
export default createAlovaMockAdapter([mocks], {
  // 指定taro请求适配器后，未匹配模拟接口的请求将使用这个适配器发送请求
  httpAdapter: axiosRequestAdapter(),

  // axiosMockResponse中包含了onMockResponse和onMockError
  // 用于将模拟数据转换为AxiosResponse和AxiosError兼容的格式
  ...axiosMockResponse
});

export const alovaInst = createAlova({
  // ...
  // 通过环境变量控制是否使用模拟请求适配器
  requestAdapter: process.env.NODE_ENV === 'development' ? mockAdapter : axiosRequestAdapter()
});
```
