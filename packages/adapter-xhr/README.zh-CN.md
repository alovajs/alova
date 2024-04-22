# @alova/adapter-xhr

alova 的 XMLHttpRequest 适配器

[![npm](https://img.shields.io/npm/v/@alova/adapter-xhr)](https://www.npmjs.com/package/@alova/adapter-xhr)
[![build](https://github.com/alovajs/adapter-xhr/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/alovajs/adapter-xhr/actions/workflows/main.yml)
[![coverage status](https://coveralls.io/repos/github/alovajs/adapter-xhr/badge.svg?branch=main)](https://coveralls.io/github/alovajs/adapter-xhr?branch=main)
![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

<p>中文 | <a href="./README.md">📑English</a></p>

[官网](https://alova.js.org/extension/alova-adapter-xhr) | [核心库 alova](https://github.com/alovajs/alova)

## 安装

```bash
npm install @alova/adapter-xhr --save
```

## 使用方法

### 创建 alova

使用 **xhrRequestAdapter** 作为 alova 的请求适配器。

```javascript
import { createAlova } from 'alova';
import { xhrRequestAdapter } from '@alova/adapter-xhr';

const alovaInst = createAlova(
  // ...
  requestAdapter: xhrResponseAdapter(),
  // ...
);
```

### 请求

XMLHttpRequest 适配器提供了基本的配置参数，包含`responseType`、`withCredentials`、`mimeType`、`auth`，具体如下：

```javascript
const list = () =>
  alovaInst.Get('/list', {
    /**
     * 设置响应数据类型
     * 可以设置更改响应类型。 值为：“arraybuffer”、“blob”、“document”、“json”和“text”
     * 默认为“json”
     */
    responseType: 'text',

    /**
     * 当凭证要包含在跨源请求中时为true。 当它们被排除在跨源请求中以及当 cookie 在其响应中被忽略时为 false。 默认为false
     */
    withCredentials: true,

    /**
     * 设置响应数据的mimeType
     */
    mimeType: 'text/plain; charset=x-user-defined',

    /**
     * auth 表示使用 HTTP Basic 身份验证，并提供凭据。
     * 这将设置一个 `Authorization` 标头，覆盖任何现有的
     * 使用 `headers` 设置的 `Authorization` 自定义标头。
     * 请注意，只有 HTTP Basic 身份验证可以通过此参数进行配置。
     * 对于 Bearer 令牌等，请改用 `Authorization` 自定义标头。
     */
    auth: {
      username: 'name1',
      password: '123456'
    }
  });
const { loading, data } = useRequest(list);
// ...
```

### 上传

使用`FormData`上传文件，这个`FormData`实例会通过`xhr.send`发送到服务端。

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

在开发应用时，我们仍然可能需要用到模拟请求。只是默认情况下，[模拟请求适配器(@alova/mock)](https://alova.js.org/extension/alova-mock)的响应数据是一个`Response`实例，即默认兼容`GlobalFetch`请求适配器，当使用 XMLHttpRequest 适配器时，我们需要让模拟请求适配器的响应数据适配 XMLHttpRequest 适配器，此时你需要使用**@alova/adapter-xhr**包中导出的`xhrMockResponse`作为响应适配器。

```javascript
import { defineMock, createAlovaMockAdapter } from '@alova/mock';
import { xhrRequestAdapter, xhrMockResponse } from '@alova/adapter-xhr';

const mocks = defineMock({
  // ...
});

// 模拟数据请求适配器
export default createAlovaMockAdapter([mocks], {
  // 指定请求适配器后，未匹配模拟接口的请求将使用这个适配器发送请求
  httpAdapter: xhrRequestAdapter(),

  // 使用xhrMockResponse，让模拟数据适配XMLHttpRequest适配器
  onMockResponse: xhrMockResponse
});

export const alovaInst = createAlova({
  // ...
  // 通过环境变量控制是否使用模拟请求适配器
  requestAdapter: process.env.NODE_ENV === 'development' ? mockAdapter : xhrRequestAdapter()
});
```
