# @alova/vue-options

Provide vue options support for alova's use hooks. Usually, use hook can only be used in vue's setup, but through the auxiliary function provided by `@alova/vue-options`, you can also use alova's use hook in vue's options, which is perfectly compatible with almost all functions of alova.

> Available in both vue2 and vue3.

[![npm](https://img.shields.io/npm/v/@alova/vue-options)](https://www.npmjs.com/package/@alova/vue-options)
[![build](https://github.com/alovajs/vue-options/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/alovajs/vue-options/actions/workflows/release.yml)
[![coverage status](https://coveralls.io/repos/github/alovajs/vue-options/badge.svg?branch=main)](https://coveralls.io/github/alovajs/vue-options?branch=main)
![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

[Official website](https://alova.js.org/extension/alova-mock) | [Core library alova](https://github.com/alovajs/alova)

[alova](https://github.com/alovajs/alova) is a lightweight request strategy library. It provides targeted request strategies for different request scenarios to improve application availability and fluency, and reduce Server-side pressure enables applications to have excellent strategic thinking like a wise man.

## Install

```bash
# use npm
npm install alova @alova/vue-options --save

# use yarn
yarn add alova @alova/vue-options

```

> alova version >= 2.13.1

## Usage

First use `vueOptionHook` to create an alova instance.

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

Then use `mapAlovaHook` to map the return value set of use hook to the component instance. The following is how to access the reactive state and operation functions:

1. You can access responsive status such as `loading/data/error` through the key of the collection, such as `this.key.loading`, `this.key.data`.
2. You can access the operation function through the key of the collection plus the function name, and use `$` to splice it, such as `this.key$send`, `this.key$onSuccess`.

Below is a complete example.

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
    // mapAlovaHook will return the mixins array, and the usage of use hook is the same as before
    mixins: mapAlovaHook(function (vm) {
      //You can access the component instance through this or vm
      // when access this, the callback cannot be an arrow function
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
        event.sendArgs.copyWithin;
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

## function mapAlovaHook description

`mapAlovaHook` is used to map the state and function collection returned by alova's use hook to the vue component instance through mixins. It receives a callback function and returns the return value collection of use hook.

It is worth noting that the callback function will be executed in the `created` phase, and you can access the vue component instance in the following way.

```javascript
// 1. Access the component instance through this. Note that the callback function cannot be an arrow function.
mapAlovaHook(function () {
  console.log(this);
  return {
    todoRequest: useRequest(getData)
  };
});

// =======================
// 2. Access the component instance through function parameters. In this case, arrow functions can be used
mapAlovaHook(vm => {
  console.log(vm);
  return {
    todoRequest: useRequest(getData)
  };
});
```

## Type

### Type inference

`@alova/vue-options` provides complete type support, whether typescript is used or not, the type of mapped value will be infered automatically, for example:

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

### Add types for response data

Except for `this.todoRequest.data`, all other values have the correct type, so how to set the type for `data` too? In fact, it is the same as alova used in other environments.

**javascript**

In javascript, you can use type annotations to add types. The first two generic parameters of Method are `unknown`, and the third generic parameter is the type of response data.

```javascript
import { Method } from 'alova';

/** @type {() => Method<unknown, unknown, { content: string, time: string }[]>} */
export const getData = () => alovaInst.Get('/todolist');
```

**typescript**

To add response data type in typescript, please read [alova documentation typescript chapter](https://alova.js.org/tutorial/advanced/typescript/#the-type-of-response-data)

## LICENSE

[MIT](https://en.wikipedia.org/wiki/MIT_License)
