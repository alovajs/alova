# [alova](https://github.com/JOU-amjs/alova)

The request scene management library of the MVVM library, it is an arm of the request library, not a replacement.✔️

[中文文档](README-zh.md)

[![npm](https://img.shields.io/npm/v/alova)](https://www.npmjs.com/package/alova)
[![build](https://github.com/JOU-amjs/alova/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/JOU-amjs/alova/actions/workflows/main.yml)
[![coverage status](https://coveralls.io/repos/github/JOU-amjs/alova/badge.svg?branch=main)](https://coveralls.io/github/JOU-amjs/alova?branch=main)
[![minzipped size](https://badgen.net/bundlephobia/minzip/alova)](https://bundlephobia.com/package/alova)
[![dependency](https://badgen.net/bundlephobia/dependency-count/alova)](https://bundlephobia.com/package/alova)
[![tree shaking](https://badgen.net/bundlephobia/tree-shaking/alova)](https://bundlephobia.com/package/alova)
![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)
![license](https://img.shields.io/badge/license-MIT-blue.svg)


## Features
1. React/Vue/Svelte request non-asynchronous usage
2. Similar api design to axios, simple and familiar
3. Stateful response data
4. Response data cache
5. Data pre-fetch
6. Silent submit
7. Offline submit
8. Request stabilization
9. Lightweight Gzip 4kb+
10. Typescript support
11. Tree shaking support
12. Status Update Tracking

## Table of contents
- [What is request scene management](#what-is-request-scene-management)
- [Request scene model](#request-scene-model)
  - [request timing](#request-timing)
  - [request behavior](#request-behavior)
  - [request event](#request-event)
  - [response data management](#response-data-management)
- [Volume comparison of various libraries](#volume-comparison-of-various-libraries)
- [install](#install)
  - [npm](#npm)
  - [cdn](#cdn)
- [Getting Started](#getting-started)
  - [Create Alova instance](#create-alova-instance)
  - [Set global request interceptor](#set-global-request-interceptor)
  - [Set global response interceptor](#set-global-response-interceptor)
  - [Create request method object](#create-request-method-object)
  - [request method type](#request-method-type)
  - [Set request timeout](#set-request-timeout)
  - [Set cache time for response data](#set-cache-time-for-response-data)
    - [memory mode(default)](#memory-mode(default))
    - [persistence mode](#persistence-mode)
    - [Persistent placeholder mode](#persistent-placeholder-mode)
  - [Send the request at the right time](#send-the-request-at-the-right-time)
    - [useRequest](#useRequest)
    - [useWatcher](#useWatcher)
    - [useFetcher](#useFetcher)
  - [response data management](#response-data-management)
    - [Transform response data](#transform-response-data)
    - [Actively invalidate the response cache](#actively-invalidate-the-response-cache)
    - [Update response data across pages or modules](#update-response-data-across-pages-or-modules)
    - [Custom setting cache data](#custom-setting-cache-data)
- [Next step](#next-step)
  - [Request method details](#request-method-details)
  - [Set initial response data](#set-initial-response-data)
  - [Manual Interrupt Request](#manual-interrupt-request)
  - [Request anti-shake](#request-anti-shake)
  - [Method object matcher](#method-object-matcher)
  - [Download progress](#download-progress)
  - [Upload progress](#upload-progress)
  - [Parallel request](#parallel-request)
  - [Serial request](#serial-request)
  - [Silent submit](#silent-submit)
  - [Offline submit](#offline-submit)
  - [Delayed data update](#delayed-data-update)
- [Advanced](#advanced)
  - [Custom request adapter](#custom-request-adapter)
  - [Custom statesHook](#custom-stateshook)
  - [Custom storage adapter](#custom-storage-adapter)
  - [Response States Edit Tracking](#response-states-edit-tracking)
  - [Typescript support](#typescript-support)
    - [Usehooks state type](#usehooks-state-type)
    - [Response data type](#response-data-type)
    - [Type inferred from request adapter](#type-inferred-from-request-adapter)
    - [Global request interceptor type](#global-request-interceptor-type)
    - [Global response interceptor type](#global-response-interceptor-type)
    - [Method configuration object type](#method-configuration-object-type)
    - [Request adapter type](#request-adapter-type)
    - [Custom statesHook type](#custom-stateshook-type)
- [practice example](#practice-example)


## What is request scene management
We always have to think about the following questions when making a request,
1. When is the request made;
2. Whether to display the request status;
3. Whether to encapsulate it into a request function for repeated calls;
4. How to process the response data;
5. Whether to cache frequently used response data;
6. How to operate data across pages;
7. Can I still submit data when I am offline?
8. ...

`fetch` or `axios` tend to focus more on how to interact with the server, but we always need to deal with the above problems by ourselves. These functions that are beneficial to application performance and stability will always allow programmers to write low-maintenance functions. sexual code. The request scene management is to abstract all the links from the preparation of the request to the completion of the response data processing, so as to cover the model of the entire CS interaction life cycle from the perspective of the front end. `alova` is a request scene management library based on the request scene model. It is a supplement to the request library such as `axios`, not a replacement.
> CS interaction: refers to all client types and server-side data interaction

## Request scene model
![model](https://user-images.githubusercontent.com/29848971/185773573-761b6153-9e6c-42df-b0b7-beddd405833c.png)
### request timing
Describes when a request needs to be made, implemented as `useHook` in `alova`.
- Initialize display data, such as just entering an interface or sub-interface;
- Human-computer interaction triggers CS interaction, which requires changing data to re-issue requests, such as page turning, filtering, sorting, fuzzy search, etc.;
- Pre-loading data, such as pre-loading the content of the next page in a pagination, predicting that the user clicks a button to pre-fetch data;
- To operate server-side data, it is necessary to issue a request for addition, deletion and modification, such as submitting data, deleting data, etc.;
- Synchronize the status of the server, such as polling requests in scenarios where data changes rapidly, and re-pulling data after operating a certain data;


### Request behavior
Describes how to handle the request, implemented as a method object in `alova`.
- Placeholder request, displaying loading, skeleton diagram, or the last real data used when requesting;
- Cache high-frequency responses, and execute requests multiple times will use fresh data;
- Multi-request serial and parallel;
- Anti-shake for frequent requests, avoid front-end data flashing, and reduce server pressure;
- Important interface retry mechanism to reduce the probability of request failure caused by network instability;
- Silent submit, when you only care about submitting data, directly respond to the success event after submitting the request, and the background ensures that the request is successful;
- Offline submit, temporarily store the submitted data locally when offline, and submit it after network connection;

### request event
Indicates that the request is sent with the request parameters, and the response is obtained. `alova` can cooperate with any request library or native solution such as `axios`, `fetch`, `XMLHttpRequest`.

### Response data management
`alova` will state and manage the response data in a unified manner. The response data can be operated at any location, and the corresponding views can be automatically updated by using the characteristics of the MVVM library.
- Remove the cached response data and pull it from the server when the request is made again;
- Update cache response data, which can update response data at any location, which is very beneficial to update data across pages;
- Refresh the response data, which can re-refresh the response data at any location, and is also very beneficial to update data across pages;
- Custom setting cache, when requesting batch data, you can manually set the cache for batch data one by one, so as to satisfy the cache hit of subsequent single data;

## Volume comparison of various libraries
|alova|react-query|vue-request|vue|react|
| ---- | ---- | ---- | ---- | ---- |
| [![minzipped size](https://badgen.net/bundlephobia/minzip/alova)](https://bundlephobia.com/package/alova) | [![minzipped size](https://badgen.net/bundlephobia/minzip/react-query)](https://bundlephobia.com/package/react-query) | [![minzipped size](https://badgen.net/bundlephobia/minzip/vue-request)](https://bundlephobia.com/package/vue-request) | [![minzipped size](https://badgen.net/bundlephobia/minzip/vue)](https://bundlephobia.com/package/vue) | [![minzipped size](https://badgen.net/bundlephobia/minzip/react-dom)](https://bundlephobia.com/package/react-dom) |


## Install
### npm
```bash
# use npm
npm install alova --save

# use yarn
yarn add alova
```

### cdn
```html
<!-- The core code, the global variable is alova -->
<script src="https://unpkg.com/alova/dist/alova.umd.min.js"></script>

<!-- Predefined Request Adapter -->
<script src="https://unpkg.com/alova/dist/adapter/globalfetch.umd.min.js"></script>

<!-- vue states hook, the global variable is VueHook, vue needs to be imported before use -->
<script src="https://unpkg.com/alova/dist/hooks/vuehook.umd.min.js"></script>

<!-- react states hook, the global variable is ReactHook, you need to import react before use -->
<script src="https://unpkg.com/alova/dist/hooks/reacthook.umd.min.js"></script>

<!-- svelte states hook, the global variable is SvelteHook, svelte and svelte/store need to be imported before use -->
<script src="https://unpkg.com/alova/dist/hooks/sveltehook.umd.min.js"></script>
```

## Getting Started
In the next getting started guide, we will take todo as an example, and focus on getting the todo list on different dates, viewing todo details, and creating, editing, and deleting items. explain. Let's look down together!

### Create Alova instance
An `alova` instance is the starting point of use, and all requests need to start from it. It is written like `axios`, and the following is the simplest way to create an `alova` instance.
```javascript
import { createAlova } from 'alova';
import GlobalFetch from 'alova/GlobalFetch';
import VueHook from 'alova/vue';
const alovaInstance = createAlova({
  // Suppose we need to interact with the server for this domain
  baseURL: 'https://api.alovajs.org',

  // Assuming we are developing a Vue project, VueHook can help us create request-related states that can be managed by Alova using vue's ref function, including request status loading, response data data, request error object error, etc. (detailed later)
  // If we are developing a React project, we can use ReactHook via alova/react
  // If using Svelte project, we can use SvelteHook via alova/svelte
  statesHook: VueHook,

  // request adapter, we recommend and provide the fetch request adapter
  requestAdapter: GlobalFetch(),
});
```

### Set global request interceptor
Usually, we need to use the same configuration for all requests, such as adding token and timestamp to the request header, `alova` provides us with a global request interceptor, which will be triggered before the request, we can use this interceptor Set request parameters uniformly in `axios`, which is also similar to `axios`.
```javascript
const alovaInstance = createAlova({
   // Ignore other parameters...

   // The function parameter config contains all the requested configurations such as url, params, data, headers, etc.
   beforeRequest(config) {
     // Suppose we need to add the token to the request header
     config.headers.token = 'token';
   },
});
```

### Set global response interceptor
When we want to parse the response data and handle errors uniformly, we can specify a global response interceptor when creating an `alova` instance, which is also similar to `axios`. Response interceptors include interceptors for successful requests and interceptors for failed requests.
```javascript
const alovaInstance = createAlova({
  // Ignore other parameters...

  // Use two items of the array to specify the interceptor for successful request and the interceptor for failed request respectively
  responsed: {

    // Interceptor for successful request
    // When using GlobalFetch to request the adapter, the first parameter receives the Response object
    // The second parameter is the configuration of the request, which is used to synchronize the configuration information before and after the request
    onSuccess: async (response, config) => {
      const json = await response.json();
      if (json.code !== 200) {
        // When an error is thrown here, it will enter the request failure interceptor
        throw new Error(json.message);
      }
      
      // The parsed response data will be passed to three hook functions: staleTime, persistTime, and transformData. These functions will be explained later
      return json.data;
    },

    // Interceptor for failed requests
    // When the request throws an error, or when the request succeeds the interceptor throws an error, the interceptor will be entered.
    // The second parameter is the configuration of the request, which is used to synchronize the configuration information before and after the request
    onError: (err, config) => {
      alert(error.message);
    }
  }
});
```
If you do not need to set an interceptor for failed requests, you can directly pass in the interceptor function for successful requests.
```javascript
const alovaInstance = createAlova({
  // Ignore other parameters...

  async responsed(response, config) {
    // Interceptor for successful request
  },
});
```
> ⚠️Note: Request success can be normal function and asynchronous function.

### Create request method object
In `alova`, each request corresponds to a method object representation, which describes the url, request header, request parameters, and request behavior parameters such as response data processing, cache processing data, etc., and it does not actually send a request. The creation of the `Method` object is also similar to the `axios` request sending function.
Let's first create a `Method` object that gets the todo list, probably like this

```javascript
// Create a Get object that describes the information of a Get request
const todoListGetter = alova.Get('/todo/list', {
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  },
  // The params parameter will be spliced ​​after the url in the form of ?
  params: {
    userId: 1
  }
});
```
Then create a `Method` object that creates a todo item, probably like this
```javascript
// create Post object
const createTodoPoster = alova.Post('/todo/create',
  // The second parameter is the http body data
  {
    title: 'test todo',
    time: '12:00'
  },
  // The third parameter is the request configuration related information
  {
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    },
    params: {
      // ...
    }
  }
);
```
> ⚠️Note: The `Method` object only stores the information required for the request, but it does not send a request, but needs to send a request through `use hook`, which is different from `axios`.

### Request method type
`Alova` provides abstract objects including seven request methods: GET, POST, PUT, DELETE, HEAD, OPTIONS, and PATCH. For the specific usage, please read [Advanced-Request Method Details](#Request Method Details).

### Set request timeout
`alova` provides global and request-level timeout settings. After the global request timeout is set, all `Method` objects created by `alova` will inherit this setting.
```javascript
// Globally set the request timeout
const alovaInstance = createAlova({
   // Ignore other parameters...

   // Request timeout, in milliseconds, the default is 0, which means never timeout
   timeout: 50000,
});
```

Set the request-level request timeout when creating the request method object, which overrides the global `timeout` parameter.
```javascript
// request timeout at request level
const todoListGetter = alova.Get('/todo/list', {
   // Ignore other parameters...

   timeout: 10000,
});
```

### Set cache time for response data
When you are writing the todo details page, you may think that users will frequently click to view the details in the todo list. It would be great if the user would not repeatedly request the interface when viewing a certain detail repeatedly, and the data could be returned immediately. It not only improves the response speed, but also reduces the server pressure. At this point we can set the response data cache for a todo detail `Method` object. By default, only `alova.Get` will have a response data cache time of 300000ms (5 minutes), and developers can also customize the settings.

> ⚠️The key of the response data cache: is the combination of the method instance's request method (method), request address (url), request header parameters (headers), url parameters (params), and request body parameters (requestBody) as a unique identifier, any A different position will be treated as a different key.

The following is a method to globally set the response cache time, which is inherited by all `Method` objects created by `alova`. The cache of `alova` has three modes, namely memory mode, persistent mode, and persistent placeholder mode.
#### memory mode(default)
Indicates that the cache is placed in memory, which means that refreshing the page cache will invalidate it, which is the most commonly used cache mode.
```javascript
const alovaInstance = createAlova({
  // Ignore other parameters...

  localCache: {
    // Set the cache mode to memory mode
    mode: cacheMode.MEMORY,

    // in milliseconds
    // When set to `Infinity`, it means that the data will never expire, when set to 0 or a negative number, it means no cache
    expire: 60 * 10 * 1000,
  },

  ///////////////////////
  ///////////////////////
  // Because the default is memory mode, the above settings can also be abbreviated as this
  localCache: 60 * 10 * 1000,
});
```
#### Persistence Mode
Indicates that the cache is placed in a storage such as `localStorage`. If the expiration time is not reached, even if the page cache is refreshed, it will not be invalidated. It is generally used for some data that needs server management but is basically unchanged.
```javascript
const alovaInstance = createAlova({
  // Ignore other parameters...

  localCache: {
    // Set cache mode to persistent mode
    mode: cacheMode.STORAGE_RESTORE,

    // in milliseconds
    // When set to `Infinity`, it means that the data will never expire, when set to 0 or a negative number, it means no cache
    expire: 60 * 10 * 1000,

    // cache tag
    tag: 'v1',
  },
});
```
> ⚠️Cache tag tag parameter: For reasons of interface data changes and front-end processing response data logic changes, you need to invalidate the original persistent cache immediately after publishing. At this time, you can set the `tag` attribute, and each persistent The data contains a `tag` identifier. When the `tag` changes, the original persistent data will become invalid, and the new data will be retrieved and identified with the new `tag`.

#### Persistent placeholder mode
When the page data does not want to only display the loading icon, but the actual data, and at the same time to load the latest data, we can use the persistent placeholder mode, which will also persist the cached data when it is loaded for the first time, and then immediately when it is requested again Returns the cached data, but unlike the persistence mode, it also immediately issues a request and updates the cache, so that the actual data can be displayed quickly and the latest data can be obtained.
```javascript
const alovaInstance = createAlova({
  // Ignore other parameters...

  localCache: {
    // Set the cache mode to persistent placeholder mode
    mode: cacheMode.STORAGE_PLACEHOLDER,
    // cache time
    expire: 60 * 10 * 1000,

    // This mode also supports cache tags
    tag: 'v1',
  },
});
```

The above cache settings also support the request level. Set the `localCache` parameter on the create request method object to achieve the purpose, and the setting method is the same.
```javascript
const todoListGetter = alova.Get('/todo/list', {
  // Ignore other parameters...

  // parameter usage is the same as global
  localCache: 60 * 10 * 1000,
});
```

## Send the request at the right time
Next, let's take a look at how to actually make a request. In `alova`, `useRequest`, `useWatcher`, and `useFetcher` three `use hook` are provided to realize the request timing, and they control when the request should be made. At the same time, it will create and maintain stateful request-related data for us, such as `loading`, `data`, `error`, etc., saving developers the trouble of maintaining these states independently. Let's learn about them below.

### useRequest
It represents the sending of a request. When `useRequest` is executed, a request will be sent by default, and it is the most commonly used method when the page obtains initialization data. It also supports the default request sending which is turned off, which is very useful in scenarios triggered by click events such as submitting data. Now let's make a request for the todo list data.
```javascript
const {
  // loading is the loading state value, when it is loaded, its value is true, and it is automatically updated to false after the end
  // Vue3 environment (using VueHook): it is a readonly Ref type value, you can access it through loading.value, or directly bind to the interface
  // In the React16 environment (using ReactHook): its value is a common boolean value, and the setLoading function will be called internally to update its value when the request state changes
  // In the Svelte environment (using SvelteHook): it is a value of type Readable, and its value will be maintained internally
  loading,

  // response data
  data: todoList,

  // Request error object, it has a value when the request is wrong, otherwise it is undefined
  error,

  // successful callback binding
  onSuccess,

  // Failed callback binding
  onError,

  // complete callback binding
  onComplete,

  // Directly pass in the Method object to send the request
} = useRequest(todoListGetter, {
  // initial data data
  initialData: [],
});
onSuccess(todoListRaw => {
  console.log('The request is successful, the response data is:', todoListRaw);
});
onError(error => {
  console.log('The request failed, the error message is:', error);
});
onComplete(() => {
  console.log('The request is completed, it will be called regardless of success or failure');
});
```
You can use todoList directly to render the todo list
```html
<div v-if="loading">Loading...</div>
<div v-else-if="error" class="error">{{ error.message }}</div>
<template v-else>
  <div v-for="todo in todoList">
    <div class="todo-title">{{ todo.title }}</div>
    <div class="todo-time">{{ todo.time }}</div>
  </div>
</template>
```

When you need to create a new todo item, you can turn off the default sending request and switch to triggering the request manually. Then change the first parameter of useRequest to a function that returns a `Method` object, which is called when the request is fired.
```javascript
const createTodoPoster = newTodo => alova.Post('/todo', newTodo);

const {
  loading,
  data,
  error,

  // The function of the manual sender request, the request is sent after the call
  send: addTodo,
} = useRequest(newTodo => createTodoPoster(newTodo), {
  // When immediate is false, it is not emitted by default
  immediate: false
});


// Manually send the request
const handleAddTodo = () => {

  /** Manual trigger function can accept any number of parameters, these parameters will be passed to 4 functions
   * 1. It can be received when the first parameter of useRequest is a callback function
   * 2. The callback set by onSuccess starts to receive from the second parameter (the first parameter is the response data)
   * 3. The callback set by onError starts to receive from the second parameter (the first parameter is the error object)
   * 4. Received from the first parameter in the callback set by onComplete
   *
   * Returns: a Promise object that can receive response data
   */
  const newTodo = {
    title: 'New todo item',
    time: new Date().toLocaleString()
  };
  addTodo(newTodo)
    .then(result => {
      console.log('Add todo item successfully, the response data is:', result);
    })
    .catch(error => {
      console.log('Failed to add todo item, the error message is:', error);
    });
};
```

### useWatcher
It is used to monitor the specified state changes, and then send the request immediately, which is useful in scenarios such as paging, data filtering, and fuzzy search. At the same time, if you want to update the server data, let's take the search todo item as an example.
```javascript
// create method instance
const filterTodoList = text => {
  return alova.Get('/tood/list/search', {
    params: {
      searchText: text,
    }
  });
};
const searchText = ref(''); // Vue3
// const [searchText, setSearchText] = useState(''); // React16

const {
  loading,
  data: todoList,
  error

  // The first parameter must be a function that returns an instance of method
} = useWatcher(() => filterTodoList(searchText.value),

  // Array of monitored states, these state changes will trigger a request
  [searchText], {

    // Set 500ms anti-shake, if the searchText changes frequently, the request will only be sent 500ms after it stops changing
    debounce: 500,
  }
);
```
```html
<!-- searchText changes as input changes -->
<input v-model="searchText" />

<!-- Render filtered todo list -->
<div v-if="loading">Loading...</div>
<template v-else>
  <div v-for="todo in todoList">
    <div class="todo-title">{{ todo.title }}</div>
    <div class="todo-time">{{ todo.time }}</div>
  </div>
</template>
```
If you want to paginate requests in the todo list, you can do this.
```javascript
// method instance creation function
const getTodoList = currentPage => {
  return alova.Get('/tood/list', {
    params: {
      currentPage,
      pageSize: 10
    }
  });
};

const currentPage = ref(1); // Vue3
const {
  loading,
  data: todoList,
  error,

  // The first parameter is the function that returns the method instance, not the method instance itself
} = useWatcher(() => getTodoList(currentPage.value),
  // Array of monitored states, these state changes will trigger a request
  [currentPage], {
    // ⚠️ Calling useWatcher does not trigger by default, pay attention to the difference from useRequest
    // Manually set immediate to true to get the first page data initially
    immediate: true,
  }
);
```
> ⚠️If you only want to re-request the data of the current page (maybe the data has been updated), you can also trigger the request manually, the usage is the same as `useRequest`.


### useFetcher
It is used to pull data, and the response data cannot be received directly. The usage scenarios of `useFetcher` are as follows:
1. Preload the data that will be used in the subsequent process and store it in the cache, so that users no longer wait for the process of data loading;
2. Refresh interface data across pages. When the pulled data is rendered in the page, it will not only update the cache, but also update the response status to refresh the interface. For example, after modifying an item in the todo list, the latest data will be pulled again. The interface will be refreshed after the response.

In contrast to `useRequest` and `useWatcher`, `useFetcher` requires an `alova` instance object to determine how the state should be created, and it does not return a `data` field, renames `loading` to `fetching`, and does not `send` function, but with an additional `fetch` function, you can reuse the fetch function to pull different data, and use the same fetching and error states, so as to achieve the purpose of unified processing.

Now let's modify a certain todo data, and re-pull the latest todo list data to refresh the interface.

```javascript
const getTodoList = currentPage => {
  return alova.Get('/tood/list', {
    // Note: The name attribute is set here to filter out the required Method object when the Method object cannot be specified directly
    name: 'todoList',
    params: {
      currentPage,
      pageSize: 10
    }
  });
};

const {

  // The fetching attribute is the same as loading, true when a pull request is sent, and false after the request is complete
  fetching,
  error,
  onSuccess,
  onError,
  onComplete,

  // Only after calling fetch will the request to pull data be sent. You can repeatedly call fetch multiple times to pull data from different interfaces.
  fetch,
} = useFetcher(alova);

// Trigger data pull in event
const handleSubmit = () => {
  // Assuming you have finished modifying the todo item...

  // Start pulling the updated data
  // Case 1: When you clearly know to pull the first page of todoList data, pass in a Method object
  fetch(getTodoList(1));

  // Case 2: When you only know to pull the data of the last request of the todoList, filter by the Method object matcher
  fetch({
    name: 'todoList',
    filter: (method, index, ary) => {

      // Return true to specify the Method object to be pulled
      return index === ary.length - 1;
    },
  })
};
```
A unified pull state can also be rendered in the interface.
```html
<div v-if="fetching">{{ Fetching data in the background... }}</div>
<!-- Ignore the html related to the todo parameter setting -->
<button @click="handleSubmit">Modify todo item</button>
```
The fetch function will ignore the existing cache, forcibly initiate a request and update the cache. As for the `Method` object matcher, see [Advanced-Method Object Matcher](#Method Object Matcher) for details.

## Response data management
The response data is stateful and managed uniformly, and we can access any response data at any location and operate on them.

### Transform response data
When the response data structure cannot directly meet the front-end requirements, we can set the `transformData` hook function for the method instance to convert the response data into the required structure, and the data will be used as the value of the `data` state after conversion.

```javascript
const todoListGetter = alova.Get('/tood/list', {
   params: {
     page: 1,
   },

   // The function accepts raw data and response header objects, and asks to return the converted data, which will be assigned to the data state.
   // Note: rawData is generally the data filtered by the response interceptor. For the configuration of the response interceptor, please refer to the [Set Global Response Interceptor] chapter.
   transformData(rawData, headers) {
     return rawData.list.map(item => {
       return {
         ...item,
         statusText: item.done ? 'completed' : 'in progress',
       };
     });
   }
});
```

### Actively invalidate the response cache
There is such a scenario, when the user clicks on an item in the todo list, enters the todo details page and edits it, at this time we hope that the todo list data in the previous page is also updated to the edited content, usually The practice is to trigger the content update of the previous page through an event, which increases the maintenance cost. And `alova` provides 3 ways to achieve this purpose very elegantly:
1. Use `useFetcher` to immediately re-request the latest data, which has been covered in the above section;
2. Manually update the cache, which will be explained in detail in the next section;
3. Invalidate the cache of this response, when the request is made again, the data will be re-requested due to cache invalidation. That's what this section is about.

Now we try to achieve this requirement by way of cache invalidation.
```javascript
import { invalidateCache } from 'alova';

const getTodoList = currentPage => {
  return alova.Get('/tood/list', {
    params: {
      currentPage,
      pageSize: 10
    }
  });
};

const {
  // ...
  send,
  onSuccess
} = useRequest(createTodoPoster, { immediate: false });
// After the submission is successful, the todo data cache of the first page is fixed to be invalidated
onSuccess(() => {
  invalidateCache(getTodoList(1));
});

// When the handleSubmit function is triggered, the request will be triggered
const handleSubmit = () => {
  send();
};
```
Its function is far more than that, we can also achieve multiple or even all cache invalidation by setting the `Method` object matcher.

```javascript
const getTodoList = currentPage => {
  return alova.Get('/tood/list', {
    // Note: The name attribute is set to filter out the required Method object when the Method object cannot be specified directly
    name: 'todoList',
    params: {
      currentPage,
      pageSize: 10
    }
  });
};

const {
  // ...
  send,
  onSuccess
} = useRequest(createTodoPoster, { immediate: false });
// After the submission is successful, the todo data cache of the first page is fixed to be invalidated
onSuccess(() => {

  // invalidate all response caches named todoList
  invalidateCache({
    name: 'todoList',
    filter: (method, index, ary) => {
      // The response cache for the first 5 Method objects named todoList will be invalidated
      return index < 5;
    },
  });

  // When no parameters are passed, invalidate all response caches
  invalidateCache();
});
```

For details on how to use the `Method` object matcher, see [Advanced-Method Object Matcher](#Method Object Matcher)

### Update response data across pages or modules
Let's continue the example mentioned in the above section [Active invalidation response cache] (#Active invalidation response cache), when the user clicks on an item in the todo list, enters the todo details page and edits it, this At the same time, we hope that the todo list data in the previous page is also updated to the edited content. Using `useFetcher` and `invalidateCache` will re-initiate the request. Is there any method that does not require re-request?

Of course there is!
```javascript
import { updateState } from 'alova';

// the todo item being edited
const editingTodo = {
  id: 1,
  title: 'todo1',
  time: '09:00'
};

const {
  send,
  onSuccess
} = useRequest(createTodoPoster, { immediate: false });

// After the submission is successful, the todo data cache of the first page is fixed to be invalidated
onSuccess(() => {

  // After the submission is successful, the todo data data of the first page is fixedly modified
  // The first parameter is the Method object, and the second is the callback function containing the original cached data, which needs to return the modified data
  updateState(getTodoList(1), todoList => {
    return todoList.map(item => {
      if (item.id === editingTodo.id) {
        return {
          ...item,
          ...editingTodo,
        };
      }
      return item;
    });
  });
});
```
> 1. When you modify the cached data, not only will the corresponding responsive state be updated, but if there is a persistent cache, it will also be updated together.
> 2. Alova manages the state returned by the hook only when useRequest and useWatcher are used to initiate a request. The reason is that the response state is generated and saved through a Method object, but the url in the Method object is not initiated when the request is not initiated. , params, query, headers and other parameters are still uncertain.

Maybe sometimes you want to call `updateState` to update the data immediately when the todo creation data is silently submitted, and also want to update the `id` again after the todo item is created, you can learn more about [Update delayed data](#update-delayed-data)


### Custom setting cache data
Some service interfaces support batch request data, which means that it is always composed of indeterminate sets of response data. When we want to batch request data when initializing the page, and then request only a single piece of data in the interaction, it will cause caching penetration problem.

For example, we need to obtain the todo list data by date. During initialization, we obtained the data from May 1st to 5th and 5 days in one request, and then the user obtained the data of May 1st again during the operation. Hit the May 1st data during initialization, because the initialized 5-day data are stored together instead of separately cached, at this time we can manually create a single response cache for the 5-day data, so that It can solve the problem of cache penetration when a single data request is made.

```javascript
import { setCacheData } from 'alova';

const getTodoListByDate = dateList => alova.Get('/todo/list/dates', {
  params: { dateList }
});
// Get 5 days of data in batches during initialization
const dates = ref([
  '2022-05-01',
  '2022-05-02',
  '2022-05-03',
  '2022-05-04',
  '2022-05-05',
]);
const {
  // ...
  onSuccess
} = useWatcher(() => getTodoListByDate(dates.value.join()),
  [dates],
  {
    immediate: true
  }
);
onSuccess(todoListDates => {
  if (todoListDates.length <= 1) {
    return;
  }

  // By default, these 5 days of data will be cached together in a key
  // In order to make subsequent requests for a certain day's data also hit the cache, we can disassemble the 5-day data into daily, and manually set the response cache one by one through setCacheData
  // The first parameter of setCacheData is the method instance object, which is used to specify the cache key
  // The second parameter is the cache data
  todoListDates.forEach(todoDate => {
    setCacheData(getTodoListByDate(todoDate.date), [ todoDate ]);
  });
});
```
At this point and when the switch date is May 1st, it will hit our manually set response cache.
```javascript
const handleTodolistToggle = () => {
  // The dates value is being listened to by useWatcher, so changing it automatically triggers the request
  dates.value = ['2022-05-01'];
}
```

## Next step
### Request method details
The `Alova` instance object provides abstract objects for seven request methods, including GET, POST, PUT, DELETE, HEAD, OPTIONS, and PATCH.
- GET: `alova.Get(url[, config])`;
- POST: `alova.Post(url[, data[, config]])`;
- PUT: `alova.Put(url[, data[, config]])`;
- DELETE: `alova.Delete(url[, data[, config]])`;
- HEAD: `alova.Head(url[, config])`;
- OPTIONS: `alova.Options(url[, config])`;
- PATCH: `alova.Patch(url[, data[, config]])`;

Parameter Description:
- `url` is the request path, it will be concatenated with `baseURL` in `createAlova` to form a complete url for request;
- `data` is the request body data object;
- `config` is the request configuration object, which includes the configuration of request headers, params parameters, request behavior parameters, etc.;

### Set initial response data
Before a page gets the initial data, it inevitably needs to wait for the server to respond. Before responding, it is generally necessary to initialize the state to an empty array or empty object to avoid page errors. We can use `useRequest` and `useWatcher` The second parameter in implements the setting of the initial data.
```javascript
// Set initial data in useRequest
const {
  // The initial value of data before the response is [], not undefined
  data
} = useRequest(todoListGetter, {
  initialData: []
});

// The same method set in useWatcher
const {
  // The initial value of data before the response is [], not undefined
  data
} = useWatcher(() => getTodoList(/* parameters */), [/* watch states */], {
  initialData: []
});
```


### Manual interrupt request
When the `timeout` parameter is not set, the request will never time out. If you need to manually interrupt the request, you can receive the `abort` method when the `useRequest` and `useWatcher` functions are called.
```javascript
const {
   // Ignore other parameters...

   // abort function is used for interrupt request
   abort
} = useRequest(todoListGetter);

// Call abort to interrupt the request
const handleCancel = () => {
   abort();
};
```

### Request anti-shake
Usually, we write anti-shake code at the level of frequently triggered events. This time, we implemented the anti-shake function at the request level, which means that you no longer have to implement anti-shake in the fuzzy search function, and the usage is very simple.
```javascript
const searchText = ref(''); // Vue3
const {
   loading,
   data: todoList,
   error
} = useWatcher(() => filterTodoList(searchText.value),
   [searchText], {

     // Set the debounce property in milliseconds
     // If the searchText here changes frequently, the request is only sent 500ms after the change is stopped
     debounce: 500,
   }
);
```


### Method object matcher
When we finish processing some business, we need to call `invalidateCache`, `updateState`, `fetch` to invalidate the cache, manually update the cache, or re-pull data. There are generally two scenarios:
1. The developer knows which request data needs to be manipulated. At this time, when calling the above three functions, a `Method` object can be directly passed in;
2. The developer only knows the request that needs to operate a certain order bit, but is not sure which one. At this time, we can use the method of `Method` object matcher to filter out.


The `Method` object matcher is filtered according to the `name` property set by the `Method` object. Multiple matchers are allowed to set the same `name`, so first you need to set the `name` property for the `Method` object that needs to be filtered .
```javascript
// A new Method object is generated each time getTodoList is called, and their name is the same
const getTodoList = currentPage => alova.Get('/tood/list', {
  name: 'todoList',
  params: {
    currentPage,
    pageSize: 10
  }
});
```
Secondly, we can pass in the matcher when calling the `invalidateCache`, `updateState`, `fetch` functions. The format of the complete `Method` object matcher is as follows:
```javascript
type MethodFilter = {
  name: string | RegExp;
  filter: (method: Method, index: number, methods: Method[]) => boolean;
};
```
`name` indicates the `Method` object that needs to be matched. It matches an array, and then uses the `filter` filter function to filter out the final set of `Method` objects. The `filter` function returns true to indicate that the match was successful, and false to indicate that the match was successful. Failing that, let's look at a few examples.
```javascript
// The following means match all Method objects with name 'todoList' and invalidate their cache
invalidateCache({
  name: 'todoList',
  filter: (method, index, methods) => true,
});

// The following means match all Method objects whose name starts with 'todo'
invalidateCache({
  name: /^todo/,
  filter: (method, index, methods) => true,
});

// If you don't need to set a filter function, you can also pass in a string or regular expression directly
invalidateCache('todoList');
invalidateCache(/^todo/);

// The following means to re-pull the data of the last request of the todo list
const { fetch } = useFetcher(alova);
fetch({
  name: 'todoList',
  filter: (method, index, methods) => index === methods.length - 1,
});
```
It is important to note that `invalidateCache` will invalidate all caches corresponding to the filtered `Method` objects, while `updateState` and `fetch` will only operate on the first item in the `Method` object collection.

### Download progress
Before getting the download progress, you need to enable the download progress on the specified `Method` object, and then receive the `downloading` responsive state in the three use hooks `useRequest`, `useWatcher`, `useFetcher`, which will continue during the download process Update this status.
```javascript
const downloadGetter = alova.Get('/tood/downloadfile', {
  enableDownload: true
});
const {
  dowinlading
} = useRequest(downloadGetter);
```
```html
<div>File size: {{ downloading.total }}B</div>
<div>Downloaded: {{ downloading.loaded }}B</div>
<div>Progress: {{ downloading.loaded / downloading.total * 100 }}%</div>
```

### Upload progress
The upload progress is used in the same way as the download progress, first enabled and then by receiving the `uploading` reactive status.
```javascript
const uploadGetter = alova.Get('/tood/uploadfile', {
  enableUpload: true
});
const {
  uploading
} = useRequest(uploadGetter);
```
```html
<div>File size: {{ uploading.total }}B</div>
<div>Uploaded: {{ uploading.loaded }}B</div>
<div>Progress: {{ uploading.loaded / uploading.total * 100 }}%</div>
```

> ⚠️Due to the limitation of fetch api, the `GlobalFetch` adapter provided by the `alova` library does not support upload progress. If you need to upload the progress, please write your own request adapter, see [Advanced-Write Request Adapter](#Write Request Adapter).


### Parallel request
Simple parallel request, just need to use multiple useRequest at the same time
```javascript
const {
  data: todoList
} = useRequest(todoListGetter);
const {
  data: todoCounter
} = useRequest(todoCountGetter);
```
But such a request is only suitable for pure parallel requests. If you need to perform some operations after the parallel requests are all completed, there are two ways to achieve it.

Method 1: You can manually create a promise object and use `Promise.all` to complete the effect.
```javascript
const {
  data: todoList,
  onSuccess: onListSuccess,
  onError: onListError
} = useRequest(todoListGetter);
const {
  data: todoCounter,
  onSuccess: onCountSuccess,
  onError: onCountError
} = useRequest(todoCountGetter);

// Manually create the promise object
onMounted(async() => {
  const listPromise = new Promise((resolve, reject) => {
    onListSuccess(resolve);
    onListError(reject);
  });
  const countPromise = new Promise((resolve, reject) => {
    onCountSuccess(resolve);
    onCountError(reject);
  });
  const [
    listResponse,
    countResponse,
  ] = await Promise.all([listPromise, countPromise]);
  // The parallel request is completed, continue to process the business...
});
```

Method 2: Using the `send` function returned by the `useRequest` function, calling `send` will return an available promise object.
```javascript
// Let them not automatically send requests first
const {
  send: sendList
} = useRequest(todoListGetter, { immediate: false });
const {
  send: sendCount
} = useRequest(todoCountGetter, { immediate: false });

// Use the promise object returned by the send function
onMounted(async() => {
  const [
    listResponse,
    countResponse,
  ] = await Promise.all([sendList(), sendCount()]);
  // The parallel request is completed, continue to process the business...
});
```

### Serial request
Serial requests can be done by writing:
```javascript
// The first request is sent automatically, and the second request waits for the first request to complete before triggering
const {
  data: todoList,
  onSuccess,
} = useRequest(todoListGetter);
const {
  data: todoDetail,
  send: sendTodoDetail
} = useRequest(todoId => todoDetailGetter(todoId), { immediate: false });

// Get the list first, then get the details of the first todo
onSuccess(todoList => {
  sendTodoDetail(todoList[0].id);
});
```

### Silent submit
Suppose you want to further improve the experience of creating todo items, so that the user clicks the "Create" button to take effect immediately, without feeling the process of submitting to the server, you can consider using the silent submit method.

You might be thinking, can the server render the results to the user without a response? Yes, `alova` has a reliable mechanism for background requests. In the network connection environment, the request is repeated every 2 seconds until the request is successfully completed. This is very effective when the service is unstable. Of course, you still need to remind you that no In a stable situation, if your data is displayed on multiple ends, it may be a little out of sync.

Let's show the code that silently creates todo items.
```javascript
const createTodoPoster = newTodo => alova.Post('/todo/create', newTodo);

const {
  send,
  onSuccess
} = useRequest(createTodoPoster, {
  // enable silent submit when request
  silent: true,
});
onSuccess(() => {
  // After silent submission, onSuccess will be called immediately, and the first parameter of the callback function is undefined
  // and onError will never be called
  // Immediately add the new todo item to the list
  updateState(todoListGetter, todoList => [...todoList, newTodo]);
});

// Click the create button to trigger this function
const handleSubmit = () => {
  send({
    title: 'test todo',
    time: '12:00'
  });
};
```

There is a problem with the above silent submission, that is, the new todo item does not have an id, and the id generally needs to wait for the submission to return. At this time, we can use delayed data update.
```javascript
// omit other code...
onSuccess(() => {
   updateState(todoListGetter, todoList => [
     ...todoList,
     {
       // id is set as a placeholder, which will be automatically replaced with actual data after waiting for the response
       '+id': ({ id }) => id,
       ...newTodo
     }
   ]);
});
```
Dive into [Delayed data update](#delayed-data-update).

### Offline submit
If you are developing an online document writer, each input of the user needs to be automatically synchronized to the server, and the user can continue to write even in the offline state. In this scenario, we can use the offline submission mechanism of `alova` , in fact, this function and the silent submission function are integrated, both benefit from the reliable mechanism of `alova` background request.

Its processing method is that when silent submission is enabled, submitting data in offline state will directly cache the request data locally, and when the network is restored, the cached request data will be automatically resubmitted to the server, which ensures that Silent submit while offline are also reliable.

Next, we take the online document writer as an example to show the code submitted offline.
```javascript
const editingText = ref('');
const saveDoc = () => alova.Post('/doc/save', {
  text: editingText.value
});
const {
  loading
} = useWatcher(saveDoc, [editingText], {
  // enable silent submit
  silent: true,

  // Set 500ms anti-shake to reduce server pressure
  debounce: 500
});
```
```html
<div v-if="loading">Submitting...</div>
<textarea v-model="editingText"></textarea>
```

This completes the simple online document writer. Of course, offline submission is also applicable in the example of silent submission to create todo items, that is, the smooth creation of todo items can be guaranteed even in the offline state.


### Delayed data update
You may have such a requirement: when you create a todo item, set it to silent submission, and immediately call `updateState` to update the todo list, so that although you can immediately see the newly added todo item on the interface, there is no id yet, so this Todo items cannot be edited and deleted unless the full data is requested again.

Deferred data update is used to solve this problem, it allows you to mark the id field with a placeholder format, replace the placeholder with a `default` value or `undefined` before the response, and then automatically put it after the response. The actual data replaces placeholder markers.
```javascript
const newTodo = {
  title: '...',
  time: '10:00'
};
const { onSuccess } = useRequest(/*...*/); // silent submit
onSuccess(() => {
  updateState(/*...*/, todoList => {
    const newTodoWithPlaceholder = {
      // Complete writing of placeholder format
      id: {
        // The value of action is a fixed spelling
        action: 'responsed',

        // getter function for delayed update
        // It will be called after the response and replace the return value on the id property, the res parameter is the response data
        value: res => res.id,

        // Default value before data update, optional, undefined if not set
        default: 0,
      },
      ...newTodo,
    };

    return [
      ...todoList,
      newTodoWithPlaceholder,
    ];
  });
});
```
The above `newTodoWithPlaceholder` data will be compiled into the following value before responding, and the todo list page can immediately display the new todo item.
```javascript
{
  id: 0, // because the default value before the request is set
  title: '...',
  time: '10:00',
};
```
After the response, the id will be replaced by the return value of the getter function. At this time, the new todo item also supports operations such as editing and deleting.
```javascript
// Assume the response data is { id: 10 }
{
  id: 10,
  title: '...',
  time: '10:00',
};
```

Delayed data placeholders can be used anywhere.

used in array.
```javascript
[1, 2, { action: 'responsed', value: res => res.id }]

// data before response
[1, 2, undefined]

// data after response
// Assume the response data is { id: 10 }
[1, 2, 10]
```

used on the object.
```javascript
{
  a: { action: 'responsed', value: res => res.id },
  b: { action: 'responsed', value: res => res.id, default: 1 },
}
// When placeholders are set to object properties, they can be abbreviated as follows
// key starts with "+"
{
  '+a': res => res.id, // only set the getter function
  '+b': [res => res.id, 1], // set the getter function and default value
}

// data before response
{
  a: undefined,
  b: 1,
}

// data after response
// Assume the response data is { id: 10 }
{
  a: 10,
  b: 10,
}
```

Use on non-arrays and objects.
```javascript
// directly represented as a placeholder
{
  action: 'responsed',
  value: res => res.data,
  default: { name: '', age: 0 }
}

// data before response
{ name: '', age: 0 }

// data after response
// Assume the response data is { data: { name: 'Tom', age: 18 } }
{ name: 'Tom', age: 18 }
```

Used in combinations of arrays and objects
```javascript
[
   1,
   {action: 'responsed', value: res => res.id, default: 12},
   res => res.id,
   4,
   {
     a: 1,
     b: 2,
     '+c': res => res.id,
     d: {action: 'responsed', value: res => res.id, default: 24},
     e: [
       {action: 'responsed', value: res => res.id, default: 36},
       3,
       6
     ]
   }
]

// data before response
[
   1,
   12,
   res => res.id, // shorthand can only be used in objects with + prefixed key, so does not compile
   4,
   {
     a: 1,
     b: 2,
     c: undefined,
     d: 24,
     e: [
       36,
       3,
       6
     ]
   }
]

// data after response
// Assume the response data is { id: 10 }
[
   1,
   10,
   res => res.id, // shorthand can only be used in objects with + prefixed key, so does not compile
   4,
   {
     a: 1,
     b: 2,
     c: 10
     d: 10,
     e: [
       10,
       3,
       6
     ]
   }
]
```


> ⚠️Limitation 1: Delayed data update is only valid in silent mode, and the `updateState` function is called synchronously in the `onSuccess` callback function, otherwise it may cause data confusion or error.

> ⚠️ Limitation 2: If there is a circular reference in the updated value of `updateState`, the delayed data update will no longer take effect


## Advanced
### Custom Request Adapter
Remember how you created an Alova instance? When calling `createAlova`, you must pass in `requestAdapter`, which is the request adapter of `alova`. Imagine that when `alova` runs in a non-browser environment (may be a client, a small program), `fetch api` may not If it is available again, then we need to replace a request adapter that supports the current environment.

So how to customize a request adapter? Very simple, it is actually a function, this function is called every time a request is made, and an object is returned, which contains such as `url`, `method`, `data`, `headers`, `timeout`, etc. Request related data sets, although there are many fields, we only need to access the data we need.

The parameter type of the request adapter, as well as the writing method that supports Typescript, can be [click here to view the description](#request adapter type).

A simple request adapter looks like this:
```javascript
function customRequestAdapter(config) {
  // Deconstruct the data that needs to be used
  const {
    url,
    method,
    data,
    headers,
  } = config;

  // send request
  const fetchPromise = fetch(url, {
    method: method,
    headers: headers,
    body: data,
  });

  // Returns an object containing the requested operation
  return {
    response: () => fetchPromise,
    headers: () => fetchPromise.then(res => res.headers),
    abort: () => {
      // TODO: interrupt request...
    },
    onDownload: updateDownloadProgress => {
      let loaded = 0;
      let timer = setInterval(() => {
        updateDownloadProgress(1000, loaded += 1000);
        if (loaded >= 1000) {
          clearInterval(timer);
        }
      }, 100);
    },
    onUpload: (updateUploadProgress) => {
      let loaded = 0;
      let timer = setInterval(() => {
        updateUploadProgress(1000, loaded += 1000);
        if (loaded >= 1000) {
          clearInterval(timer);
        }
      }, 100);
    },
  };
}
```
Description of the return value of the request adapter:
1. [Required] `response`: an asynchronous function, the function returns the response value, which will be passed to the global response interceptor response;
2. [Required] `headers`: an asynchronous function, the response header object returned by the function will be passed to the transformData conversion hook function of the Method object;
3. [Required] `abort`: an ordinary function, which is used for interrupt request. When the `abort` function is called in the [Manual Interrupt Request](#Manual Interrupt Request) chapter, the function that actually triggers the interrupt request is this interrupt function;
4. [Optional] `onDownload`: a common function, which receives a callback function for updating the download progress, and customizes the frequency of progress update in this function. In this example, the simulation is updated every 100 milliseconds. The `updateDownloadProgress` callback function receives two parameters, the first parameter is the total size, and the second parameter is the downloaded size;
5. [Optional] `onUpload`: a common function, which receives a callback function for updating the upload progress. The frequency of the progress update is customized in this function. In this example, the simulation is updated every 100 milliseconds. The `updateUploadProgress` callback function receives two parameters, the first parameter is the total size, and the second parameter is the uploaded size;

It is recommended that you refer to the [GlobalFetch source code](https://github.com/JOU-amjs/alova/blob/main/src/predefine/GlobalFetch.ts) for more details about the request adapter.


### Custom statesHook
Remember the `statesHook` you passed in when calling `createAlova`? It will decide which MVVM library status you return when you request, such as `VueHook` in vue project, `ReactHook` in react project, `SvelteHook` in svelte project, currently only these three libraries are supported. In most cases you should not use this feature, but if you need to adapt to more MVVM libraries that we don't support yet, you need to write `statesHook` custom.

`statesHook` is a normal object containing specific functions, but these are still basically no algorithm, let's see how VueHook is written.
```javascript
import { ref, readonly, watch, onUnmounted } from 'vue';

const VueHook = {
  // state creation function
  create: rawData => ref(data),

  // state export function
  export: state => readonly(state),

  // dehydration function
  dehydrate: state => state.value,

  // responsive state update function
  update: (newVal, states) => {
    Object.keys(newVal).forEach(key => {
      states[key].value = newVal[key];
    });
  },

  // request to send control function
  effectRequest({
    handler,
    removeStates,
    saveStates,
    immediate,
    frontStates,
    watchingStates
  }) {
    // Remove the corresponding state when the component is unloaded
    onUnmounted(removeStates);

    // When calling useRequest and useFetcher, watchingStates are undefined
    if (!watchingStates) {
      handler();
      return;
    }

    // When useWatcher is called, watchingStates is an array of states that need to be monitored
    // When immediate is true, it means that the request needs to be sent immediately
    watch(watchingStates, handler, { immediate });
  },
};
```
Description of each function of custom `statesHook`:
1. [Required] `create`: responsive state creation function, `loading`, `error`, `data`, `downloading`, `uploading`, etc. are all created by calling this function, such as the vue3 project will be created as ref value;
2. [Required] `export`: state export function, this function receives the responsive state created by the create function, and exports the state that is finally used by developers. Here, the state exported by `VueHook` is readonly;
3. [Required] `dehydrate`: dehydrate function, which means to convert the responsive state into ordinary data, which is the opposite of create, in `updateState`;
4. [Required] `update`: responsive state update function, the state update maintained by `alova` is completed through this function. This function receives two parameters, the first parameter is the new data object, the second parameter is the map collection of the original reactive state, here you can write a fixed loop to update `states`;
5. [Required] `effectRequest`: request sending control function, it will execute this function immediately when `useRequest`, `useWatcher`, `useFetcher` are called, we need to complete three things in this function:
    1. When the current component is uninstalled, call the removeStates function to remove the responsive state involved in the current component to avoid memory overflow;
    2. When calling useWatcher, bind the state monitor, and call the sendRequest function when the state changes. You can use whether `states` is an array to judge whether `useWatcher` is called, and at the same time, the `immediate` parameter is used to judge the `useWatcher` call whether the request needs to be sent immediately;
    3. When calling `useRequest` and `useFetcher`, call sendRequest to send a request, at this time `states` is `undefined`;

> ⚠️ Note: If the library involved in statesHook is like `react`, the use hook of `alova` will be called every time it is re-rendered, then in `effectRequest`, you need to trigger the `saveStates` function every time you re-render, this It's because `react` refreshes its state references every time it re-renders, so we need to re-save them again.

[Click here to view the ReactHook source code](https://github.com/JOU-amjs/alova/blob/main/src/predefine/ReactHook.ts)

If you want it to support typescript after customizing statesHook, you can [click here to view](#custom-statesHook-type)

### Custom Storage Adapter
`alova` involves multiple functions that require data persistence, such as persistent caching, silent submit, and offline submit. By default, `alova` will use `localStorage` to store persistent data, but for non-browser environments, customization is also supported.

Custom storage adapters are also very simple, you only need to specify functions to save data, get data, and remove data, roughly like this.
```javascript
const customStorageAdapter = {
   setItem(key, value) {
     // save data
   },
   getItem(key) {
     // retrieve data
   },
   removeItem(key) {
     // remove data
   }
};
```
Then pass in this adapter when creating an `alova` instance.
```javascript
const alovaInstance = createAlova({
   // ...
   storageAdapter: customStorageAdapter
});
```

### Response States Edit Tracking
coming soon


### Typescript support
On the Typescript side, we do put a lot of effort into optimization in order to provide a better user experience, and we try our best to use automatically inferred types to reduce the number of times you define types.

#### Usehooks state type
When `createAlova` creates an alova instance, it will automatically infer the state types created by `useRequest`, `useWatcher`, and `useFetcher` according to the incoming `statesHook`. Unfortunately, currently only three MVVM library types are supported: Vue, React, and Svelte. If you involve other libraries, you need to write your own types to implement them.

When using VueHook:
```javascript
const vueAlova = createAlova({
  statesHook: VueHook,
  // ...
});
const {
  loading, // Readonly<Ref<boolean>>
  data, // Readonly<Ref<unknown>>
  error, // Readonly<Ref<Error>>
} = useRequest(vueAlova.Get('/todo/list'));
```
When using ReactHook:
```javascript
const reactAlova = createAlova({
  statesHook: ReactHook,
  // ...
});
const {
  loading, // boolean
  data, // unknown
  error, // Error
} = useRequest(reactAlova.Get('/todo/list'));
```
When using SvelteHook:
```javascript
const svelteAlova = createAlova({
  statesHook: SvelteHook,
  // ...
});
const {
  loading, // Readable<boolean>
  data, // Readable<unknown>
  error, // Readable<Error>
} = useRequest(svelteAlova.Get('/todo/list'));
```
You may find that the type of data is `unknown`, because data needs to be set separately according to different interfaces, let's take a look next.
#### Response data type
When you specify a type for a data interface, there are two cases.

Case 1: The response data does not need to call `transformData` again
```typescript
interface Todo {
  title: string;
  time: string;
  done: boolean;
}
const Get = alova.Get<Todo[]>('/todo/list');
```

Case 2: The response data needs to be transformed by calling `transformData` again
```typescript
interface Todo {
  title: string;
  time: string;
  done: boolean;
}
const Get = alova. Get('/todo/list', {
  // Write the type to the data parameter, and the headers will be automatically inferred, so you don't need to specify the type
  transformData(data: Todo[], headers) {
    return data.map(item => ({
      ...item,
      status: item.done ? 'done' : 'incomplete'
    }));
  }
});
```
In this way, the data data will have a specific type. It should be noted that the response data is converted by the global response interceptor, so when setting the type, it should also be set to the converted type.


#### Type inferred from request adapter
Because `alova` supports custom request adapters, and different adapters may have different request configuration objects, response objects, and response headers, so the global `beforeRequest`, `responsed` interceptors, and `Method` object creation configuration The type of the object will be automatically inferred based on the type provided by the request adapter. Let's look at these types first.
```typescript
// Generic configuration type for generic Method objects
type CommonMethodConfig = {
  readonly url: string,
  readonly method: MethodType,
  data?: Record<string, any> | FormData | string,
};

// The type of the configuration object when the `Method` object was created
type AlovaMethodConfig<R, T, RC, RH> = {
  // The following is the configuration object specified when creating the Method object
  name?: string,

  // parameters in the url, an object
  params?: Record<string, any>,

  // request header, an object
  headers?: Record<string, any>,

  // Silent request, onSuccess will be triggered immediately, if the request fails, it will be saved in the cache and continue to poll the request
  silent?: boolean,

  // current interrupt time
  timeout?: number,

  // The response data will not be requested again within the cache time. Get and head requests are kept fresh for 5 minutes by default (300000 milliseconds), and other requests are not cached by default
  localCache?: number | {
    expire: number,
    mode?: number,
    tag?: string | number,
  },

  // Whether to enable download progress information. After enabling, each request for progress will have a progress value. Otherwise, the same value is 0, and it is not enabled by default.
  enableDownload?: boolean,

  // Whether to enable upload progress information. After enabling, each request progress will have a progress value. Otherwise, the same value is 0, and it is not enabled by default.
  enableUpload?: boolean,

  // In response to data conversion, the converted data will be converted to the data state. If there is no conversion data, the response data will be directly used as the data state
  transformData?: (data: T, headers: RH) => R,
} & RC;
```
The `RC`, `RH` involved here, and the `RE` that does not appear here are all inferred by the request adapter. They represent the request configuration object type, response header object type, and response type respectively. If you use ` When GlobalFetch`, their types will be inferred as:
1. `RC` configures the object `RequestInit` for the request of the fetch api;
2. `RH` is the response header object `Headers`;
3. `RE` is the response object `Response`;

Knowing this, we continue to look at the following type definitions.

#### Global request interceptor type
The global pre-request interceptor `beforeRequest` receives an aggregated request configuration of type:
```typescript
type AlovaRequestAdapterConfig<R, T, RC, RH> =
  CommonMethodConfig
  & AlovaMethodConfig<R, T, RC, RH>
  & {
    // Will ensure that the headers, params parameters are an object
    headers: Record<string, any>,
    params: Record<string, any>,
  };
```

#### Global response interceptor type
The global response interceptor `responsed` receives a response object of type response object `RE`.
```typescript
type ResponsedHandler<RE> = (response: RE) => any;
```
When the request adapter uses `GlobalFetch`, `RE` will be automatically inferred as `Response` type.

#### Method configuration object type
The type of the Method configuration object is the above-mentioned [AlovaMethodConfig] (# the type inferred from the request adapter), which contains the union of common configuration parameters and the `RC` inferred from the request adapter. When the request adapter uses `GlobalFetch`, `RC` will be automatically inferred to be of type `RequestInit`.


#### Request adapter type
```typescript
interface Progress {
  total: number; // total amount
  loaded: number; // loaded amount
}

type AlovaRequestAdapter<R, T, RC, RE, RH> = (adapterConfig: AlovaRequestAdapterConfig<R, T, RC, RH>) => {
  response: () => Promise<RE>,
  headers: () => Promise<RH>,
  onDownload?: (handler: (total: number, loaded: number) => void) => void,
  onUpload?: (handler: (total: number, loaded: number) => void) => void,
  abort: () => void,
};
```
It should be noted that if `RC`, `RE`, `RH` types need to be automatically inferred in `alova`, then no generics should be specified on the custom request adapter, and `RC`, `RE need to be specified manually `, `RH` type, otherwise it will cause a type inference error.

Take `GlobalFetch` for example. [Click here to view the GlobalFetch source code](https://github.com/JOU-amjs/alova/blob/main/src/predefine/GlobalFetch.ts)
```typescript
type GlobalFetch = (defaultRequestInit?: RequestInit) =>
  (adapterConfig: AlovaRequestAdapterConfig<unknown, unknown, RequestInit, Headers>) => {
    response: () => Promise<Response>;
    headers: () => Promise<Headers>;
    onDownload: (handler: (total: number, loaded: number) => void) => void;
    abort: () => void;
  };
```

#### Custom statesHook type
comming soon


## Practical example
comming soon