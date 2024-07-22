# @alova/vue-options

为 alova 的 use hooks 提供 vue options 支持。通常，use hook 只能在 vue 的 setup 中使用，但通过`@alova/vue-options`提供的辅助函数，你也可以在 vue 的 options 中使用 alova 的 use hook，完美兼容 alova 的几乎所有功能。

> vue2 和 vue3 中均可使用。

[![npm](https://img.shields.io/npm/v/@alova/vue-options)](https://www.npmjs.com/package/@alova/vue-options)
[![build](https://github.com/alovajs/vue-options/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/alovajs/vue-options/actions/workflows/release.yml)
[![coverage status](https://coveralls.io/repos/github/alovajs/vue-options/badge.svg?branch=main)](https://coveralls.io/github/alovajs/vue-options?branch=main)
![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

[官网](https://alova.js.org/extension/alova-mock) | [核心库 alova](https://github.com/alovajs/alova)

[alova](https://github.com/alovajs/alova) 是一个轻量级的请求策略库，它针对不同请求场景分别提供了具有针对性的请求策略，来提升应用可用性、流畅性，降低服务端压力，让应用如智者一般具备卓越的策略思维。

## 安装

```bash
# use npm
npm install alova @alova/vue-options --save

# use yarn
yarn add alova @alova/vue-options

```

> alova 版本 >= 2.13.1

## 用法

先使用`vueOptionHook`创建 alova 实例。

```javascript
import { createAlova, Method } from 'alova';
import GlobalFetch from 'alova/GlobalFetch';
import { VueOptionsHook } from '@alova/vue-options';

// api.js
const alovaInst = createAlova({
  baseURL: 'http://example.com',
  statesHook: VueOptionsHook,
  requestAdapter: GlobalFetch(),
  responded: response => response.json()
});

/** @type {() => Method<unknown, unknown, { content: string, time: string }[]>} */
export const getData = () => alovaInst.Get('/todolist');
```

再使用`mapAlovaHook`将 use hook 的返回值集合映射到组件实例上，以下是访问响应式状态和操作函数的方法：

1. 可以通过集合的 key 来访问`loading/data/error`等响应式状态，例如`this.key.loading`、`this.key.data`。
2. 可以通过集合的 key 加函数名称来访问操作函数，并使用`$`拼接，例如`this.key$send`、`this.key$onSuccess`。

以下是一个完整的例子。

```html
<template>
  <div>
    <span role="loading">{{ todoRequest.loading ? 'loading' : 'loaded' }}</span>
    <span role="error">{{ todoRequest.error ? todoRequest.error.message : '' }}</span>
    <div role="data">{{ JSON.stringify(todoRequest.data) }}</div>
    <button
      @click="todoRequest$send"
      role="btnSend">
      send
    </button>
  </div>
</template>

<script>
  import { useRequest } from 'alova';
  import { mapAlovaHook } from '@alova/vue-options';
  import { getData } from './api';

  export default {
    // mapAlovaHook将返回mixins数组，use hook的用法与之前一致
    mixins: mapAlovaHook(function (vm) {
      // 可以通过this或vm来访问组件实例
      // 使用this时，此回调函数不能为箭头函数
      console.log(this, vm);
      return {
        todoRequest: useRequest(getData)
      };
    }),
    created() {
      this.todoRequest.loading;
      this.todoRequest$send();
      this.todoRequest$onSuccess(event => {
        event.data.match;
        event.args.copyWithin;
      });
      this.todoRequest$onSuccess(event => {
        console.log('success', event);
      });
      this.todoRequest$onError(event => {
        console.log('error', event);
      });
    },
    mounted() {
      this.todoRequest$onComplete(event => {
        console.log('complete', event);
      });
    }
  };
</script>
```

## mapAlovaHook 函数说明

`mapAlovaHook`是用于将 alova 的 use hook 返回的状态和函数集合，通过 mixins 映射到 vue 组件实例上。它接收一个回调函数并返回 use hook 的返回值集合。

值得注意的是，回调函数将会在`created`阶段执行，你可以通过以下方式访问 vue 组件实例。

```javascript
// 1. 通过 this 访问组件实例，注意回调函数不能为箭头函数
mapAlovaHook(function () {
  console.log(this);
  return {
    todoRequest: useRequest(getData)
  };
});

// =======================
// 2. 通过函数参数访问组件实例，此时可以用箭头函数
mapAlovaHook(vm => {
  console.log(vm);
  return {
    todoRequest: useRequest(getData)
  };
});
```

## 类型

### 类型推断

`@alova/vue-options`提供了完整的 ts 类型支持，无论是否使用 typescript，映射的值类型都会被自动推断，例如：

```javascript
this.todoRequest.loading; // boolean
this.todoRequest.error; // Error | undefined
this.todoRequest.data; // any
this.todoRequest$send; // (...args: any[]) => Promise<any>
this.todoRequest$onSuccess; // (handler: SuccessHandler) => void
this.todoRequest$onError; // (handler: ErrorHandler) => void
this.todoRequest$onComplete; // (handler: CompleteHandler) => void
// ...
```

### 为响应数据添加类型

除了`this.todoRequest.data`外，其他值都有了正确的类型，那么如何给`data`也设置类型呢？其实与 alova 在其他环境中使用是相同。

**javascript**

在 javascript 中可以使用类型注释添加类型，Method 的前两个泛型参数为`unknown`，第三个泛型参数就是响应数据的类型

```javascript
import { Method } from 'alova';

/** @type {() => Method<unknown, unknown, { content: string, time: string }[]>} */
export const getData = () => alovaInst.Get('/todolist');
```

**typescript**

在 typescript 中添加响应数据类型，请阅读 [alova 文档 typescript 章节](https://alova.js.org/tutorial/advanced/typescript/#the-type-of-response-data)

## LICENSE

[MIT](https://en.wikipedia.org/wiki/MIT_License)
