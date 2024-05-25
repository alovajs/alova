# @alova/adapter-uniapp

alova 的 uniapp 适配器

[![npm](https://img.shields.io/npm/v/@alova/adapter-uniapp)](https://www.npmjs.com/package/@alova/adapter-uniapp)
[![build](https://github.com/alovajs/adapter-uniapp/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/alovajs/adapter-uniapp/actions/workflows/main.yml)
[![coverage status](https://coveralls.io/repos/github/alovajs/adapter-uniapp/badge.svg?branch=main)](https://coveralls.io/github/alovajs/adapter-uniapp?branch=main)
![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

[官网](https://alova.js.org/extension/alova-adapter-uniapp) | [核心库 alova](https://github.com/alovajs/alova)

## 使用方法

### 创建 alova

调用 **AdapterUniapp** 将返回*请求适配器*、_存储适配器_，以及*VueHook*，因此你不再需要设置这三个项，使用方法完全一致。

```javascript
import { createAlova } from 'alova';
import AdapterUniapp from '@alova/adapter-uniapp';

const alovaInst = createAlova(
  baseURL: 'https://api.alovajs.org',
  ...AdapterUniapp()
);
```

### 请求

请求的使用方法与 web 环境中使用完全一致。已经完全兼容`uni.request`，你可以在创建 method 实例的*config*中指定`uni.request`支持的[全部配置项](https://uniapp.dcloud.net.cn/api/request/request.html)

```html
<tempate>
  <view v-if="loading">加载中...</view>
  <view>请求数据为：{{ data }}</view>
</tempate>

<script setup>
  const list = () =>
    alovaInst.Get('/list', {
      // 设置的参数将传递给uni.request
      enableHttp2: true,
      sslVerify: true
    });
  const { loading, data, uploading } = useRequest(list);
</script>
```

当使用`useRequest/useWatcher`立即请求数据时，它将会在`onLoad`的钩子中异步发送请求，因此你可以`methodHandler`中访问 options 参数，如下：

```javascript
import { onLoad } from '@dcloudio/uni-app';

let options = {};
const { loading, data, uploading } = useRequest(() => getDetail(options.id));
onLoad(opt => {
  options = opt;
});
```

### 上传

在 method 实例的*config*中设置`requestType: 'upload'`时表示上传文件，请求适配器将会调用`uni.uploadFile`，上传的文件数据放在 method 实例的 data 中，你需要在 data 中指定`name`、`filePath或files`，以及`file`(如果需要)，这 4 个参数将传到`uni.uploadFile`中，同时，你还可以在 data 中指定这 4 个参数外的其他参数，请求适配器会将它们传入到`formData`参数中。

同样的，已经完全兼容`uni.uploadFile`，你可以在创建 method 实例的*config*中指定`uni.uploadFile`支持的[全部配置项](https://uniapp.dcloud.net.cn/api/request/network-file.html#uploadfile)，如果还有额外的参数需要设置，请在 method 实例的*config*中指定。

```html
<tempate>
  <view v-if="loading">上传中...</view>
  <view>上传进度：{{ uploading.loaded }}/{{ uploading.total }}</view>
  <button @click="handleImageChoose">上传图片</button>
  <!-- ... -->
</tempate>

<script setup>
  const uploadFile = (name, filePath, formData) =>
    alovaInst.Post(
      '/uploadImg',
      {
        name,
        filePath,

        // 额外数据将传入uni.uploadFile的formData中
        ...formData
      },
      {
        // 设置请求方式为上传，适配器内将调用uni.uploadFile
        requestType: 'upload',
        fileType: 'image',

        // 开启上传进度
        enableUpload: true
      }
    );

  const { loading, data, uploading, send } = useRequest(uploadFile, {
    immediate: false
  });

  const handleImageChoose = () => {
    uni.chooseImage({
      success: chooseImageRes => {
        const tempFilePaths = chooseImageRes.tempFilePaths;
        send('fileName', tempFilePaths[0], {
          extra1: 'a',
          extra2: 'b'
        });
      }
    });
  };
</script>
```

### 下载

在 method 实例的*config*中设置`requestType: 'download'`时表示下载文件，请求适配器将会调用`uni.downloadFile`。

同样的，已经完全兼容`uni.downloadFile`，你可以在创建 method 实例的*config*中指定`uni.downloadFile`支持的[全部配置项](https://uniapp.dcloud.net.cn/api/request/network-file.html#downloadfile)，如果还有额外的参数需要设置，请在 method 实例的*config*中指定。

```html
<tempate>
  <view v-if="loading">下载中...</view>
  <view>下载进度：{{ downloading.loaded }}/{{ downloading.total }}</view>
  <button @click="handleImageDownload">下载图片</button>
  <!-- ... -->
</tempate>

<script setup>
  const downloadFile = filePath =>
    alovaInst.Get('/bigImage.jpg', {
      // 设置请求方式为下载，适配器内将调用uni.downloadFile
      requestType: 'download',
      filePath,

      // 开启下载进度
      enableDownload: true
    });

  const { loading, data, downloading, send } = useRequest(downloadFile, {
    immediate: false
  });

  const handleImageDownload = () => {
    send('file_save_path');
  };
</script>
```

## 模拟请求适配器兼容

在使用 uniapp 开发应用时，我们仍然可能需要用到模拟请求，只是默认情况下，[模拟请求适配器(@alova/mock)](https://alova.js.org/extension/alova-mock)的响应数据是一个`Response`实例，即默认兼容`GlobalFetch`请求适配器，当在 uniapp 环境下使用时，我们需要让模拟请求适配器的响应数据是兼容 uniapp 适配器的，因此你需要使用**@alova/adapter-uniapp**包中导出的`uniappMockResponse`作为响应适配器。

```javascript
import { defineMock, createAlovaMockAdapter } from '@alova/mock';
import AdapterUniapp, { uniappRequestAdapter, uniappMockResponse } from '@alova/adapter-uniapp';

const mocks = defineMock({
  // ...
});

// 模拟数据请求适配器
export default createAlovaMockAdapter([mocks], {
  // 指定uniapp请求适配器后，未匹配模拟接口的请求将使用这个适配器发送请求
  httpAdapter: uniappRequestAdapter,

  //  模拟响应适配器，指定后响应数据将转换为uniapp兼容的数据格式
  onMockResponse: uniappMockResponse
});

export const alovaInst = createAlova({
  baseURL: 'https://api.alovajs.org',
  timeout: 5000,
  ...AdapterUniapp({
    // 通过环境变量控制是否使用模拟请求适配器
    mockRequest: process.env.NODE_ENV === 'development' ? mockAdapter : undefined
  })
  // ...
});
```
