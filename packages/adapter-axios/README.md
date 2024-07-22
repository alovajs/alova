# @alova/adapter-axios

alova 的 axios 适配器

[![npm](https://img.shields.io/npm/v/@alova/adapter-axios)](https://www.npmjs.com/package/@alova/adapter-axios)
[![build](https://github.com/alovajs/adapter-axios/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/alovajs/adapter-axios/actions/workflows/main.yml)
[![coverage status](https://coveralls.io/repos/github/alovajs/adapter-axios/badge.svg?branch=main)](https://coveralls.io/github/alovajs/adapter-axios?branch=main)
![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

<p>English | <a href="./README.zh-CN.md">📑中文</a></p>

[官网](https://alova.js.org/extension/alova-adapter-axios) | [核心库 alova](https://github.com/alovajs/alova)

## Instructions

### create alova

Use **axiosRequestAdapter** as request adapter for alova.

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

### Request

The usage method of the request is exactly the same as that used in the web environment. Already fully compatible with **axios**, you can specify [all configuration items] supported by `axios` in _config_ of method instance creation (https://axios-http.com/docs/req_config)

> Take Vue as an example

```html
<tempate>
<div v-if="loading">Loading...</div>
<div>The request data is: {{ data }}</div>
</template>

<script setup>
const list = () =>
alovaInst. Get('/list', {
// The set parameters will be passed to axios
paramsSerializer: params => {
return Qs. stringify(params, { arrayFormat: 'brackets' });
}
});
const { loading, data } = useRequest(list);
</script>
```

### Upload

Use `FormData` to upload files, and this `FormData` instance will be passed to axios, which is consistent with the usage of axios upload files.

```javascript
const uploadFile = imageFile => {
  const formData = new FormData();
  formData.append('file', imageFile);
  return alovaInst.Post('/uploadImg', formData, {
    // Start upload progress
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

// Picture selection event callback
const handleImageChoose = ({ target }) => {
  sendUpload(target.files[0]);
};
```

### download

Point the request url to the file address to download, you can also enable the download progress by setting `enableDownload` to true.

```javascript
const downloadFile = () =>
  alovaInst.Get('/bigImage. jpg', {
    // Start download progress
    enableDownload: true,
    responseType: 'blob'
  });

const { loading, data, downloading, send, onSuccess } = useRequest(downloadFile, {
  immediate: false
});
onSuccess(({ data: imageBlob }) => {
  // download image
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

## Mock request adapter compatible

When developing applications, we may still need to use simulated requests. Only by default, the response data of [Mock Request Adapter (@alova/mock)](/extension/alova-mock) is a `Response` instance, which is compatible with the `GlobalFetch` request adapter by default. When using the axios adapter, we The response data of the mock request adapter needs to be compatible with **AxiosResponse**, and the error instance is **AxiosError**, so you need to use `axiosMockResponse` exported from the **@alova/adapter-axios** package as the response adapter .

```javascript
import { defineMock, createAlovaMockAdapter } from '@alova/mock';
import { axiosRequestAdapter, axiosMockResponse } from '@alova/adapter-axios';

const mocks = defineMock({
  //...
});

// mock data request adapter
export default createAlovaMockAdapter([mocks], {
  // After specifying the taro request adapter, requests that do not match the simulated interface will use this adapter to send requests
  httpAdapter: axiosRequestAdapter(),

  // axiosMockResponse contains onMockResponse and onMockError
  // Used to convert mock data to AxiosResponse and AxiosError compatible format
  ...axiosMockResponse
});

export const alovaInst = createAlova({
  //...
  // Control whether to use the simulated request adapter through environment variables
  requestAdapter: process.env.NODE_ENV === 'development' ? mockAdapter : axiosRequestAdapter()
});
```
