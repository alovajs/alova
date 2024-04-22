# @alova/adapter-xhr

XMLHttpRequest adapter for alova

[![npm](https://img.shields.io/npm/v/@alova/adapter-xhr)](https://www.npmjs.com/package/@alova/adapter-xhr)
[![build](https://github.com/alovajs/adapter-xhr/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/alovajs/adapter-xhr/actions/workflows/main.yml)
[![coverage status](https://coveralls.io/repos/github/alovajs/adapter-xhr/badge.svg?branch=main)](https://coveralls.io/github/alovajs/adapter-xhr?branch=main)
![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

<p>English | <a href="./README.zh-CN.md">📑中文</a></p>

[website](https://alova.js.org/extension/alova-adapter-xhr) | [alova](https://github.com/alovajs/alova)

## Install

```bash
npm install @alova/adapter-xhr --save
```

## Instructions

### create alova

Use **xhrRequestAdapter** as request adapter for alova.

```javascript
import { createAlova } from 'alova';
import { xhrRequestAdapter } from '@alova/adapter-xhr';

const alovaInst = createAlova(
   //...
   requestAdapter: xhrResponseAdapter(),
   //...
);
```

### Request

The XMLHttpRequest adapter provides basic configuration parameters, including `responseType`, `withCredentials`, `mimeType`, `auth`, as follows:

```javascript
const list = () =>
  alovaInst.Get('/list', {
    /**
     * Set the response data type
     * Can be set to change the response type. Values are: "arraybuffer", "blob", "document", "json" and "text"
     * defaults to "json"
     */
    responseType: 'text',

    /**
     * True when credentials are to be included in cross-origin requests. false when they are excluded from cross-origin requests and when cookies are ignored in their responses. Default is false
     */
    withCredentials: true,

    /**
     * Set the mimeType of the response data
     */
    mimeType: 'text/plain; charset=x-user-defined',

    /**
     * auth means use HTTP Basic authentication and provide credentials.
     * This will set an `Authorization` header, overriding any existing
     * Custom headers for `Authorization` set using `headers`.
     * Note that only HTTP Basic authentication can be configured via this parameter.
     * For Bearer tokens etc., use the `Authorization` custom header instead.
     */
    auth: {
      username: 'name1',
      password: '123456'
    }
  });
const { loading, data } = useRequest(list);
// ...
```

### Upload

Use `FormData` to upload files, and this `FormData` instance will be sent to the server through `xhr.send`.

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

When developing applications, we may still need to use simulated requests. Only by default, the response data of [Mock Request Adapter (@alova/mock)](https://alova.js.org/extension/alova-mock) is a `Response` instance, which is compatible with the `GlobalFetch` request adapter by default. When using the XMLHttpRequest adapter, we You need to adapt the response data of the mock request adapter to the XMLHttpRequest adapter. In this case, you need to use the `xhrMockResponse` exported in the **@alova/adapter-xhr** package as the response adapter.

```javascript
import { defineMock, createAlovaMockAdapter } from '@alova/mock';
import { xhrRequestAdapter, xhrMockResponse } from '@alova/adapter-xhr';

const mocks = defineMock({
  //...
});

// mock data request adapter
export default createAlovaMockAdapter([mocks], {
  // After specifying the request adapter, requests that do not match the simulated interface will use this adapter to send requests
  httpAdapter: xhrRequestAdapter(),

  // Use xhrMockResponse to adapt the simulated data to the XMLHttpRequest adapter
  onMockResponse: xhrMockResponse
});

export const alovaInst = createAlova({
  //...
  // Control whether to use the simulated request adapter through environment variables
  requestAdapter: process.env.NODE_ENV === 'development' ? mockAdapter : xhrRequestAdapter()
});
```
