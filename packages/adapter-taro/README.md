# @alova/adapter-taro

alova 的 taro 适配器

[![npm](https://img.shields.io/npm/v/@alova/adapter-taro)](https://www.npmjs.com/package/@alova/adapter-taro)
[![build](https://github.com/alovajs/adapter-taro/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/alovajs/adapter-taro/actions/workflows/main.yml)
[![coverage status](https://coveralls.io/repos/github/alovajs/adapter-taro/badge.svg?branch=main)](https://coveralls.io/github/alovajs/adapter-taro?branch=main)
![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

[官网](https://alova.js.org/extension/alova-adapter-taro) | [核心库 alova](https://github.com/alovajs/alova)

## 使用方法

### 创建 alova

调用 **AdapterTaro** 将返回*请求适配器*、_存储适配器_，以及*ReactHook*，因此你不再需要设置这三个项，使用方法完全一致。

```javascript
import { createAlova } from 'alova';
import AdapterTaro from '@alova/adapter-taro';

const alovaInst = createAlova(
  baseURL: 'https://api.alovajs.org',
  ...AdapterTaro()
);
```

### 请求

请求的使用方法与 web 环境中使用完全一致。已经完全兼容`Taro.request`，你可以在创建 method 实例的*config*中指定`Taro.request`支持的[全部配置项](https://taro-docs.jd.com/docs/apis/network/request/)

```jsx
const list = () =>
  alovaInst.Get('/list', {
    // 设置的参数将传递给Taro.request
    enableHttp2: true
  });

const App = () => {
  const { loading, data } = useRequest(list);

  return (
    { loading ? <View>加载中...</View> : null }
    <View>请求数据为：{ JSON.stringify(data) }</View>
  )
};
```

### 上传

在 method 实例的*config*中设置`requestType: 'upload'`时表示上传文件，请求适配器将会调用`Taro.uploadFile`，上传的文件数据放在 method 实例的 data 中，你需要在 data 中指定`name`和`filePath`，这 2 个参数将传到`Taro.uploadFile`中，同时，你还可以在 data 中指定这 2 个参数外的其他参数，请求适配器会将它们传入到`formData`参数中。

同样的，已经完全兼容`Taro.uploadFile`，你可以在创建 method 实例的*config*中指定`Taro.uploadFile`支持的[全部配置项](https://taro-docs.jd.com/docs/apis/network/upload/uploadFile)，如果还有额外的参数需要设置，请在 method 实例的*config*中指定。

```jsx
const uploadFile = (name, filePath, formData) =>
  alovaInst.Post(
    '/uploadImg',
    {
      name,
      filePath,

      // 额外数据将传入Taro.uploadFile的formData中
      ...formData
    },
    {
      // 设置请求方式为上传，适配器内将调用Taro.uploadFile
      requestType: 'upload',

      // 开启上传进度
      enableUpload: true
    }
  );

const App = () => {
  const { loading, data, uploading, send } = useRequest(uploadFile, {
    immediate: false
  });

  const handleImageChoose = () => {
    Taro.chooseImage({
      success: chooseImageRes => {
        const tempFilePaths = chooseImageRes.tempFilePaths;
        send('fileName', tempFilePaths[0], {
          extra1: 'a',
          extra2: 'b'
        });
      }
    });
  };

  return (
    { loading ? <View>上传中...</View> : null }
    <View>上传进度：{ uploading.loaded }/{ uploading.total }</View>
    <Button onClick={handleImageChoose}>上传图片</Button>
    {/* ... */}
  )
}
```

### 下载

在 method 实例的*config*中设置`requestType: 'download'`时表示下载文件，请求适配器将会调用`Taro.downloadFile`。

同样的，已经完全兼容`Taro.downloadFile`，你可以在创建 method 实例的*config*中指定`Taro.downloadFile`支持的[全部配置项](https://taro-docs.jd.com/docs/apis/network/download/downloadFile)，如果还有额外的参数需要设置，请在 method 实例的*config*中指定。

```jsx
const downloadFile = filePath =>
  alovaInst.Get('/bigImage.jpg', {
    // 设置请求方式为下载，适配器内将调用Taro.downloadFile
    requestType: 'download',
    filePath,

    // 开启下载进度
    enableDownload: true
  });

const App = () => {
  const { loading, data, downloading, send } = useRequest(downloadFile, {
    immediate: false
  });
  const handleImageDownload = () => {
    send('file_save_path');
  };

  return (
    { loading ? <View>下载中...</View> : null }
    <View>下载进度：{ downloading.loaded }/{ downloading.total }</View>
    <Button onClick={handleImageDownload}>下载图片</Button>
    {/* ... */}
  );
}
```

## 模拟请求适配器兼容

在使用 Taro 开发应用时，我们仍然可能需要用到模拟请求，只是默认情况下，[模拟请求适配器(@alova/mock)](https://alova.js.org/extension/alova-mock)的响应数据是一个`Response`实例，即默认兼容`GlobalFetch`请求适配器，当在 Taro 环境下使用时，我们需要让模拟请求适配器的响应数据是兼容 Taro 适配器的，因此你需要使用**@alova/adapter-taro**包中导出的`taroMockResponse`作为响应适配器。

```javascript
import { defineMock, createAlovaMockAdapter } from '@alova/mock';
import AdapterTaro, { taroRequestAdapter, taroMockResponse } from '@alova/adapter-taro';

const mocks = defineMock({
  // ...
});

// 模拟数据请求适配器
export default createAlovaMockAdapter([mocks], {
  // 指定taro请求适配器后，未匹配模拟接口的请求将使用这个适配器发送请求
  httpAdapter: taroRequestAdapter,

  //  模拟响应适配器，指定后响应数据将转换为taro兼容的数据格式
  onMockResponse: taroMockResponse
});

export const alovaInst = createAlova({
  baseURL: 'https://api.alovajs.org',
  timeout: 5000,
  ...AdapterTaro({
    // 通过环境变量控制是否使用模拟请求适配器
    mockRequest: process.env.NODE_ENV === 'development' ? mockAdapter : undefined
  })
  // ...
});
```
