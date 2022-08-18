# [alova](https://github.com/JOU-amjs/alova)

MVVM库的请求场景管理库。

它是对请求库的一种补充，而非替代品✔️

[![npm](https://img.shields.io/npm/v/alova)](https://www.npmjs.com/package/alova)
[![build](https://github.com/JOU-amjs/alova/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/JOU-amjs/alova/actions/workflows/main.yml)
[![coverage status](https://coveralls.io/repos/github/JOU-amjs/alova/badge.svg?branch=main)](https://coveralls.io/github/JOU-amjs/alova?branch=main)
[![minzipped size](https://badgen.net/bundlephobia/minzip/alova)](https://bundlephobia.com/package/alova)
[![dependency](https://badgen.net/bundlephobia/dependency-count/alova)](https://bundlephobia.com/package/alova)
[![tree shaking](https://badgen.net/bundlephobia/tree-shaking/alova)](https://bundlephobia.com/package/alova)
![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

## 什么是请求场景管理
我们在进行一次请求时总是要思考以下问题，
1. 什么时候发出请求；
2. 是否要展示请求状态；
3. 是否要封装成请求函数以便重复调用；
4. 要如何加工响应数据；
5. 是否要对高频使用的响应数据做缓存；
6. 如何进行跨页面操作数据；
7. 离线了还能提交数据吗；
8. ...

`fetch`或`axios`往往更专注于如何与服务端交互，但对于上面的问题我们总是需要自己处理，这些有利于应用性能和稳定性的功能，总会让程序员们编写出低维护性的代码。请求场景管理就是从准备请求到响应数据加工完毕的所有环节进行抽象，从而覆盖以前端为视角的，整个CS交互生命周期的模型。`Alova`就是一个以请求场景模型的请求场景管理库，它是对`axios`等请求库的一种补充，而非替代品。
> CS交互：泛指所有客户端类型和服务端的数据交互

## 请求场景模型
![model](https://user-images.githubusercontent.com/29848971/176368981-1dd4f94f-e9f9-49c4-bf11-0045df48faff.png)
### 请求时机
描述在什么时候需要发出请求，在`Alova`中以`useHook`实现。
- 初始化展示数据，如刚进入某个界面或子界面；
- 人机交互触发CS交互，需要变更数据重新发出请求，如翻页、筛选、排序、模糊搜索等；
- 预加载数据，如分页内预先加载下一页内容、预测用户点击某个按钮后预先拉取数据；
- 操作服务端数据，需发出增删改查请求，如提交数据、删除数据等；
- 同步服务端状态，如数据变化较快的场景下轮询请求、操作了某个数据后重新拉取数据；


### 请求行为
描述以怎样的方式处理请求，在`Alova`中以method对象实现。
- 占位请求，请求时展示loading、骨架图、或者是上次使用的真实数据；
- 缓存高频响应，多次执行请求会使用保鲜数据；
- 多请求串行与并行；
- 对频繁的请求进行防抖，避免前端数据闪动，以及降低服务端压力；
- 重要接口重试机制，降低网络不稳定造成的请求失败概率；
- 静默提交，当只关心提交数据时，提交请求后直接响应成功事件，后台保证请求成功；
- 离线提交，离线时将提交数据暂存到本地，网络连接后再提交；

### 请求事件
表示携带请求参数发送请求，获得响应，`Alova`可以与`axios`、`fetch`、`XMLHttpRequest`等任意请求库或原生方案共同协作。

### 响应数据管理
`Alova`将响应数据状态化，并统一管理，任何位置都可以对响应数据进行操作，并利用MVVM库的特性自动更新对应的视图。
- 移除缓存响应数据，再次发起请求时将从服务端拉取；
- 更新缓存响应数据，可更新任意位置响应数据，非常有利于跨页面更新数据；
- 刷新响应数据，可重新刷新任意位置的响应数据，也非常有利于跨页面更新数据；
- 自定义设置缓存，在请求批量数据时，可手动对批量数据一一设置缓存，从而满足后续单条数据的缓存命中；




## 特性
1. React/Vue/Svelte请求非异步用法
2. 与axios相似的api设计，简单熟悉
3. 响应数据状态化
4. 响应数据缓存
5. 数据预拉取
6. 静默提交
7. 离线提交
8. 请求防抖
9. 轻量级Gzip 4kb
10. typescript支持
11. tree shaking支持
12. 状态更新追踪

## 各类库的体积对比
|alova|react-query|vue-request|vue|react|
| ---- | ---- | ---- | ---- | ---- |
| [![minzipped size](https://badgen.net/bundlephobia/minzip/alova)](https://bundlephobia.com/package/alova) | [![minzipped size](https://badgen.net/bundlephobia/minzip/react-query)](https://bundlephobia.com/package/react-query) | [![minzipped size](https://badgen.net/bundlephobia/minzip/vue-request)](https://bundlephobia.com/package/vue-request) | [![minzipped size](https://badgen.net/bundlephobia/minzip/vue)](https://bundlephobia.com/package/vue) | [![minzipped size](https://badgen.net/bundlephobia/minzip/react-dom)](https://bundlephobia.com/package/react-dom) |


## 安装
### NPM
```bash
# 使用npm
npm install alova --save

# 使用yarn
yarn add alova
```

### CDN
```html
<!-- 核心代码，全局变量为alova -->
<script src="https://unpkg.com/alova/dist/alova.umd.min.js"></script>

<!-- vue states hook，全局变量为VueHook，使用前需引入vue -->
<script src="https://unpkg.com/alova/dist/hooks/vuehook.umd.min.js"></script>

<!-- react states hook，全局变量为ReactHook，使用前需引入react -->
<script src="https://unpkg.com/alova/dist/hooks/reacthook.umd.min.js"></script>

<!-- svelte states hook，全局变量为SvelteHook，使用前需引入svelte和svelte/store -->
<script src="https://unpkg.com/alova/dist/hooks/sveltehook.umd.min.js"></script>
```

## 入门指南
在接下来的入门指南中，我们将以待办事项（todo）为例，围绕着获取不同日期的待办事项列表、查看todo详情，以及创建、编辑、删除事项等需求进行本`alova`的讲解。让我们一起往下看吧！

### 创建Alova实例
一个`alova`实例是使用的开端，所有的请求都需要从它开始。它的写法类似`axios`，以下是一个最简单的`alova`实例的创建方法。
```javascript
import { createAlova, GlobalFetch } from 'alova';
import VueHook from 'alova/vue';
const alovaInstance = createAlova({
  // 假设我们需要与这个域名的服务器交互
  baseURL: 'https://api.alovajs.org',

  // 假设我们在开发Vue项目，VueHook可以帮我们用vue的ref函数创建请求相关的，可以被Alova管理的状态，包括请求状态loading、响应数据data、请求错误对象error等（后续详细介绍）
  // 如果正在开发React项目，我们可以通过alova/react使用ReactHook
  // 如果使用Svelte项目，我们可以通过alova/svelte使用SvelteHook
  statesHook: VueHook,

  // 请求适配器，我们推荐并提供了fetch请求适配器
  requestAdapter: GlobalFetch(),
});
```


### 设置全局请求拦截器
通常，我们需要让所有请求都用上相同的配置，例如添加token、timestamp到请求头，`alova`为我们提供了全局的请求拦截器，它将在请求前被触发，我们可以在此拦截器中统一设置请求参数，这也与`axios`相似。
```javascript
const alovaInstance = createAlova({
  // 省略其他参数...

  // 函数参数config内包含了url、params、data、headers等请求的所有配置
  beforeRequest(config) {
    // 假设我们需要添加token到请求头
    config.headers.token = 'token';
  },
});
```

### 设置全局响应拦截器
当我们希望统一解析响应数据、统一处理错误时，此时可以在创建`alova`实例时指定全局的响应拦截器，这同样与`axios`相似。响应拦截器包括请求成功的拦截器和请求失败的拦截器。
```javascript
const alovaInstance = createAlova({
  // 省略其他参数...

  // 使用数组的两个项，分别指定请求成功的拦截器和请求失败的拦截器
  responsed: {

    // 请求成功的拦截器
    // 当使用GlobalFetch请求适配器时，它将接收Response对象。
    onSuccess: async response => {
      const json = await response.json();
      if (json.code !== 200) {
        // 这边抛出错误时，将会进入请求失败拦截器内
        throw new Error(json.message);
      }
      
      // 解析的响应数据将传给staleTime、persistTime、transformData三个钩子函数，这些函数将在后续讲解
      return json.data;
    },

    // 请求失败的拦截器
    // 请求抛出错误时，或请求成功拦截器抛出错误时，将会进入该拦截器。
    onError: err => {
      alert(error.message);
    }
  }
});
```
如果不需要设置请求失败的拦截器，可以直接传入请求成功的拦截器函数。
```javascript
const alovaInstance = createAlova({
  // 省略其他参数...

  async responsed(response) {
    // 请求成功的拦截器
  },
});
```
> ⚠️注意：请求成功可以是普通函数和异步函数

### 创建请求方法对象
在`alova`中，每个请求都对应一个method对象表示，它描述了一次请求的url、请求头、请求参数，以及响应数据加工、缓存加工数据等请求行为参数，它不会实际发出请求。`Method`对象的创建也类似`axios`的请求发送函数。
我们先来创建一个获取todo列表的`Method`对象，大概是这样的

```javascript
// 创建一个Get对象，描述一次Get请求的信息
const todoListGetter = alova.Get('/todo/list', {
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  },
  // params参数将会以?的形式拼接在url后面
  params: {
    userId: 1
  }
});
```
接着再创建一个创建todo项的`Method`对象，大概是这样的
```javascript
// 创建Post对象
const createTodoPoster = alova.Post('/todo/create', 
  // 第二个参数是http body数据
  {
    title: 'test todo',
    time: '12:00'
  }, 
  // 第三个参数是请求配置相关信息
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
> ⚠️注意：`Method`对象里只是保存了请求所需要的信息，但它不会发出请求，而是需要通过`use hook`发送请求，这点与`axios`不同。

### 请求方法类型
`Alova`提供了包括GET、POST、PUT、DELETE、HEAD、OPTIONS、PATCH七种请求方法的抽象对象，具体的使用方式可以阅读[进阶-请求方法详解](#请求方法详解)。

### 设置请求超时时间
`alova`提供了全局和请求级的超时时间设置，全局设置请求超时后，所有由`alova`创建的`Method`对象都会继承该设置。
```javascript
// 全局设置请求超时时间
const alovaInstance = createAlova({
  // 省略其他参数...

  // 请求超时时间，单位为毫秒，默认为0，表示永不超时
  timeout: 50000,
});
```

在创建请求方法对象时设置请求级别的请求超时时间，它将覆盖全局的`timeout`参数。
```javascript
// 请求级别的请求超时时间
const todoListGetter = alova.Get('/todo/list', {
  // 省略其他参数...

  timeout: 10000,
});
```

### 为响应数据设置缓存时间
当你在写todo详情页的时候，你可能会想到用户会频繁在todo列表中点击查看详情，如果用户重复查看某条详情时不再重复请求接口，并且能立即返回数据，那该多好，既提升了响应速度，又减小了服务器压力。此时我们就可以为某个todo详情`Method`对象设置响应数据缓存。默认只有`alova.Get`会带有300000ms(5分钟)的响应数据缓存时间，开发者也可以自定义设置。

> ⚠️响应数据缓存的key：是由method实例的请求方法(method)、请求地址(url)、请求头参数(headers)、url参数(params)、请求体参数(requestBody)组合作为唯一标识，任意一个位置不同都将被当做不同的key。

以下是全局设置响应缓存时间的方法，所有由`alova`创建的`Method`对象都会继承该设置。`alova`的缓存有三种模式，分别为内存模式、持久化模式、持久化占位模式。
#### 内存模式（默认）
表示缓存放在内存中，这意味着刷新页面缓存即失效，是最常用的缓存模式。
```javascript
const alovaInstance = createAlova({
  // 省略其他参数...

  localCache: {
    // 设置缓存模式为内存模式
    mode: cacheMode.MEMORY,

    // 单位为毫秒
    // 当设置为`Infinity`，表示数据永不过期，设置为0或负数时表示不缓存
    expire: 60 * 10 * 1000,
  },

  ////////////////////////
  ////////////////////////
  // 因为默认是内存模式，上面的设置也可以简写成这样
  localCache: 60 * 10 * 1000,
});
```
#### 持久化模式
表示缓存放在诸如`localStorage`存储中，如果过期时间未到即使刷新页面缓存也不会失效，它一般用于一些需要服务端管理，但基本不变的数据。
```javascript
const alovaInstance = createAlova({
  // 省略其他参数...

  localCache: {
    // 设置缓存模式为持久化模式
    mode: cacheMode.STORAGE_RESTORE,

    // 单位为毫秒
    // 当设置为`Infinity`，表示数据永不过期，设置为0或负数时表示不缓存
    expire: 60 * 10 * 1000,

    // 缓存标签
    tag: 'v1',
  },
});
```
> ⚠️缓存标签tag参数：出于对接口数据变动、前端处理响应数据逻辑变动原因，我们需要在发布后让原持久化缓存在未过期时失效，此时可以设置一个不同的`tag`参数即可，然后就会重新请求接口数据了。

#### 持久化占位模式
当页面数据在加载时不希望只展示加载图标，而是实际数据，同时又去加载最新数据时，我们可以使用持久化占位模式，首次加载它也会持久化缓存数据，然后再次请求时立即返回缓存数据，但和持久化模式不同的是，它还会立即发出请求并更新缓存，这样就达到了既快速展示实际数据，又获取了最新的数据。
```javascript
const alovaInstance = createAlova({
  // 省略其他参数...

  localCache: {
    // 设置缓存模式为持久化占位模式
    mode: cacheMode.STORAGE_PLACEHOLDER,
    // 缓存时间
    expire: 60 * 10 * 1000,

    // 此模式同样支持缓存标签
    tag: 'v1',
  },
});
```

以上缓存设置同样支持请求级别，在创建请求方法对象上设置`localCache`参数来达到目的，设置方法相同。
```javascript
const todoListGetter = alova.Get('/todo/list', {
  // 省略其他参数...

  // 参数用法与全局相同
  localCache: 60 * 10 * 1000,
});
```

## 在正确的时机发送请求
接下来我们要来看看如何实际发出请求了，在`alova`中提供了`useRequest`、`useWatcher`、`useFetcher`三种`use hook`实现请求时机，由它们控制何时应该发出请求，同时将会为我们创建和维护状态化的请求相关数据，如`loading`、`data`、`error`等，省去了开发者自主维护这些状态的麻烦，下面我们来了解下它们。

### useRequest
它表示一次请求的发送，执行`useRequest`时默认会发送一次请求，在页面获取初始化数据时是最常用的方法。同时也支持关闭它的默认的请求发送，这在例如提交数据等通过点击事件触发的场景下非常有用。下面我们来发出对todo列表数据的请求。
```javascript
const {
  // loading是加载状态值，当加载时它的值为true，结束后自动更新为false
  // Vue3环境下（使用VueHook）：它是一个readonly的Ref类型的值，你可以通过loading.value访问它，或直接绑定到界面中
  // React16环境下（使用ReactHook）：它的值为普通的boolean值，请求状态变化时内部将调用setLoading函数更新它的值
  // 在Svelte环境下（使用SvelteHook）：它是一个Readable类型的值，内部将维护它的值
  loading,

  // 响应数据
  data: todoList,

  // 请求错误对象，请求错误时有值，否则为undefined
  error,

  // 成功回调绑定
  onSuccess,

  // 失败回调绑定
  onError,

  // 完成回调绑定
  onComplete,

  // 直接将Method对象传入即可发送请求
} = useRequest(todoListGetter, {
  // 初始data数据
  initialData: [],
});
onSuccess(todoListRaw => {
  console.log('请求成功，响应数据为:', todoListRaw);
});
onError(error => {
  console.log('请求失败，错误信息为:', error);
});
onComplete(() => {
  console.log('请求完成，不管成功失败都会调用');
});
```
你可以直接使用todoList来渲染todo列表
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

当你需要创建一条新的todo项时，可以先关闭默认发送请求，转为手动触发请求。然后将useRequest的第一个参数改为返回`Method`对象的函数，该函数在触发请求时被调用。
```javascript
const createTodoPoster = newTodo => alova.Post('/todo', newTodo);

const {
  loading,
  data,
  error,

  // 手动发送器请求的函数，调用后发送请求
  send: addTodo,
} = useRequest(newTodo => createTodoPoster(newTodo), {
  // 当immediate为false时，默认不发出
  immediate: false
});


// 手动发送请求
const handleAddTodo = () => {

  /** 手动触发函数可接受任意个参数，这些参数将被传入4个函数
   * 1. useRequest的第一个参数为回调函数时可以接收到
   * 2. onSuccess设置的回调中从第二个参数开始接收（第一个参数为响应数据）
   * 3. onError设置的回调中从第二个参数开始接收（第一个参数为错误对象）
   * 4. onComplete设置的回调中从第一个参数开始接收
   * 
   * 返回：一个Promise对象，可接收响应数据
   */
  const newTodo = {
    title: '新的todo项',
    time: new Date().toLocaleString()
  };
  addTodo(newTodo)
    .then(result => {
      console.log('新增todo项成功，响应数据为:', result);
    })
    .catch(error => {
      console.log('新增todo项失败，错误信息为:', error);
    });
};
```

### useWatcher
它用于监听指定的状态变化，然后立即发送请求，在分页、数据筛选、模糊搜索等场景很有用。同时如果你希望更新服务端数据，接下来我们以搜索todo项为例。
```javascript
// 创建method实例
const filterTodoList = text => {
  return alova.Get('/tood/list/search', {
    params: {
      searchText: text,
    }
  });
};
const searchText = ref('');   // Vue3
// const [searchText, setSearchText] = useState('');   // React16

const {
  loading,
  data: todoList,
  error

  // 第一个参数必须为返回method实例的函数
} = useWatcher(() => filterTodoList(searchText.value), 

  // 被监听的状态数组，这些状态变化将会触发一次请求
  [searchText], {

    // 设置500ms防抖，如果searchText频繁变化，只有在停止变化后500ms才发送请求
    debounce: 500,
  }
);
```
```html
<!-- searchText随着输入内容变化而变化 -->
<input v-model="seatchText" />

<!-- 渲染筛选后的todo列表 -->
<div v-if="loading">Loading...</div>
<template v-else>
  <div v-for="todo in todoList">
    <div class="todo-title">{{ todo.title }}</div>
    <div class="todo-time">{{ todo.time }}</div>
  </div>
</template>
```
如果要用在todo列表分页请求，你可以这样做。
```javascript
// method实例创建函数
const getTodoList = currentPage => {
  return alova.Get('/tood/list', {
    params: {
      currentPage,
      pageSize: 10
    }
  });
};

const currentPage = ref(1);   // Vue3
const {
  loading,
  data: todoList,
  error,

  // 第一个参数为返回method实例的函数，而非method实例本身
} = useWatcher(() => getTodoList(currentPage.value), 
  // 被监听的状态数组，这些状态变化将会触发一次请求
  [currentPage], {
    // ⚠️调用useWatcher默认不触发，注意和useRequest的区别
    // 手动设置immediate为true可以初始获取第1页数据
    immediate: true,
  }
);
```
> ⚠️如果你只希望重新请求当前页的数据（可能是数据更新了），你也可以手动触发请求，用法和`useRequest`相同。


### useFetcher
它用于拉取数据，响应数据不能直接接收到，`useFetcher`的请求定位如下：
1. 预加载后续流程中将会使用到的数据，让用户不再等待数据加载的过程；
2. 跨页面刷新界面数据，拉取的数据在页面中存在渲染时，它除了会更新缓存外还会更新响应状态，让界面刷新，例如修改todo列表的某一项后重新拉取最新数据，响应后将会刷新界面。

与`useRequest`和`useWatcher`相比，`useFetcher`需要传入`alova`实例对象来确定应该如何创建状态，而且它不返回`data`字段，将`loading`改名为了`fetching`，也没有`send`函数，但多了一个fetch函数，可以重复利用fetch函数拉取不同的数据，且使用同一个fetching和error等状态，从而达到统一处理的目的。

下面我们来实现修改某个todo数据，并重新拉取最新的todo列表数据，让界面刷新。

```javascript
const getTodoList = currentPage => {
  return alova.Get('/tood/list', {
    // 注意：这边设置了name属性，用于在无法直接指定Method对象时，过滤出需要的Method对象
    name: 'todoList',
    params: {
      currentPage,
      pageSize: 10
    }
  });
};

const {

  // fetching属性与loading相同，发送拉取请求时为true，请求结束后为false
  fetching,
  error,
  onSuccess,
  onError,
  onComplete,

  // 调用fetch后才会发送请求拉取数据，可以重复调用fetch多次拉取不同接口的数据
  fetch,
} = useFetcher(alova);

// 在事件中触发数据拉取
const handleSubmit = () => {
  // 假设已完成todo项的修改...

  // 开始拉取更新后的数据
  // 情况1：当你明确知道拉取todoList第一页数据时，传入一个Method对象
  fetch(getTodoList(1));

  // 情况2：当你只知道拉取todoList最后一次请求的数据时，通过Method对象过滤器来筛选
  fetch({
    name: 'todoList',
    filter: (method, index, ary) => {

      // 返回true来指定需要拉取的Method对象
      return index === ary.length - 1;
    },
  })
};
```
界面中还可以渲染统一的拉取状态。
```html
<div v-if="fetching">{{ 正在后台拉取数据... }}</div>
<!-- 省略todo参数设置相关的html -->
<button @click="handleSubmit">修改todo项</button>
```

详细的`Method`对象过滤器使用方法见 [进阶-Method对象过滤器](#Method对象过滤器)

## 响应数据管理
响应数据状态化并统一管理，我们可以在任意位置访问任意的响应数据，并对它们进行操作。

### 转换响应数据
当响应数据结构不能直接满足前端需求时，我们可以为method实例设置`transformData`钩子函数将响应数据转换成需要的结构，数据转换后将会作为`data`状态的值。

```javascript
const todoListGetter = alova.Get('/tood/list', {
  params: {
    page: 1,
  },

  // 函数接受未加工的数据和响应头对象，并要求将转换后的数据返回，它将会被赋值给data状态。
  // 注意：rawData一般是响应拦截器过滤后的数据，响应拦截器的配置可以参考[设置全局响应拦截器]章节。
  transformData(rawData, headers) {
    return rawData.list.map(item => {
      return {
        ...item,
        statusText: item.status === 1 ? '已完成' : '进行中',
      };
    });
  }
});
```

### 主动失效响应缓存
有这样一个场景，当用户点开todo列表中的某一项，进入todo详情页并对它执行了编辑，此时我们希望上一页中的todo列表数据也更新为编辑后的内容，通常的做法是通过事件来触发上一页的内容更新，这样增加了维护成本。而`alova`提供了3种方式，可以很优雅地达到这个目的：
1. 使用`useFetcher`立即重新请求最新的数据，它在上面的章节中已经讲过；
2. 手动更新缓存，这种方式将在下一个小节详细讲解；
3. 让这个响应缓存失效，当再次请求时将会因缓存失效而重新请求数据。这也是本小节所要讲的内容。

现在我们尝试以缓存失效的方式实现本需求。
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
// 提交成功后，固定使第一页的todo数据缓存失效
onSuccess(() => {
  invalidateCache(getTodoList(1));
});

// 当触发handleSubmit函数时将会触发请求
const handleSubmit = () => {
  send();
};
```
它的功能还远不止于此，我们还可以通过设置`Method`对象过滤器来实现多个，甚至全部的缓存失效。

```javascript
const getTodoList = currentPage => {
  return alova.Get('/tood/list', {
    // 注意：设置了name属性，用于在无法直接指定Method对象时，过滤出需要的Method对象
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
// 提交成功后，固定使第一页的todo数据缓存失效
onSuccess(() => {

  // 失效名称为todoList的所有响应缓存
  invalidateCache({
    name: 'todoList',
    filter: (method, index, ary) => {
      // 名为todoList的前5个Method对象的响应缓存将会失效
      return index < 5;
    },
  });

  // 不传任何参数时，失效所有响应缓存
  invalidateCache();
});
```

详细的`Method`对象过滤器使用方法见 [进阶-Method对象过滤器](#Method对象过滤器)

### 跨页面/模块更新响应数据
我们继续以上一小节[主动失效响应缓存](#主动失效响应缓存)中提到的例子来说，当用户点开todo列表中的某一项，进入todo详情页并对它执行了编辑，此时我们希望上一页中的todo列表数据也更新为编辑后的内容，使用`useFetcher`和`invalidateCache`的方式都会重新发起请求，那有没有不需要重新请求的方法呢？

当然有！
```javascript
import { updateState } from 'alova';

// 正在编辑的todo项
const editingTodo = {
  id: 1,
  title: 'todo1',
  time: '09:00'
};

const {
  send,
  onSuccess
} = useRequest(createTodoPoster, { immediate: false });

// 提交成功后，固定使第一页的todo数据缓存失效
onSuccess(() => {

  // 提交成功后，固定修改第一页的todo数据数据
  // 第一个参数为Method对象，第二个为包含原缓存数据的回调函数，该函数需要返回修改后的数据
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
> 自主修改缓存数据时，不仅会更新对应的响应式状态，如果存在持久化缓存也会一起被更新。


### 自定义设置缓存数据
有些服务接口支持批量请求数据，它意味着总是由不确定的若干组响应数据组成，当我们想要在初始化页面时批量请求数据，然后在交互中只请求单条数据的情况下，会造成缓存穿透的问题。

例如我们需要按日期获取todo列表数据，在初始化时一次请求获取了5月1日到5日，5天的数据，然后用户在操作时又获取了一次5月1日的数据，此时不会命中初始化时的5月1日数据，因为初始化的5天数据是存放在一起的，而不是分开缓存的，此时我们就可以为这5天的数据一一手动创建单条的响应缓存，这样就可以解决单条数据请求时的缓存穿透的问题。

```javascript
import { setCacheData } from 'alova';

const getTodoListByDate = dateList => alova.Get('/todo/list/dates', {
  params: { dateList }
});
// 初始化时批量获取5天的数据
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

  // 默认情况下，这5天的数据会一起缓存到一个key中
  // 为了让后续请求某一天的数据时也能命中缓存，我们可以将5天的数据拆解为按天，并通过setCacheData一一手动设置响应缓存
  // setCacheData的第一个参数为method实例对象，它用于指定缓存的key
  // 第二个参数为缓存数据
  todoListDates.forEach(todoDate => {
    setCacheData(getTodoListByDate(todoDate.date), [ todoDate ]);
  });
});
```
此时再在切换日期为5月1日时，它将会命中我们手动设置的响应缓存。
```javascript
const handleTodolistToggle = () => {
  // dates值正在被useWatcher监听，因此改变它就可以自动触发请求
  dates.value = ['2022-05-01'];
}
```

## 进阶
### 请求方法详解
`Alova`实例对象提供了七种请求方法的抽象对象，包括GET、POST、PUT、DELETE、HEAD、OPTIONS、PATCH。
- GET: `alova.Get(url[, config])`;
- POST: `alova.Post(url[, data[, config]])`;
- PUT: `alova.Put(url[, data[, config]])`;
- DELETE: `alova.Delete(url[, data[, config]])`;
- HEAD: `alova.Head(url[, config])`;
- OPTIONS: `alova.Options(url[, config])`;
- PATCH: `alova.Patch(url[, data[, config]])`;

参数说明：
- `url`是请求路径，它将会与`createAlova`中的`baseURL`拼接成完整的url进行请求；
- `data`为请求体数据对象；
- `config`为请求配置对象，其中包含了请求头、params参数等、请求行为参数等配置；

### 设置初始响应数据
一个页面在获取到初始数据前，不可避免地需要等待服务端响应，在响应前一般需要先将状态初始化为一个空数组或空对象，以免造成页面报错，我们可以在`useRequest`和`useWatcher`中的第二个参数实现初始数据的设置。
```javascript
// 在useRequest中设置初始数据
const {
  // 响应前data的初始值为[]，而不是undefined
  data
} = useRequest(todoListGetter, {
  initialData: []
});

// 在useWatcher中设置的方法相同
const {
  // 响应前data的初始值为[]，而不是undefined
  data
} = useWatcher(() => getTodoList(/* 参数 */), [/* 监听状态 */], {
  initialData: []
});
```


### 手动中断请求
未设置`timeout`参数时请求是永不超时的，如果需要手动中断请求，可以在`useRequest`、`useWatcher`函数被调用时接收`abort`方法。
```javascript
const {
  // 省略其他参数

  // 中断函数
  abort
} = useRequest(todoListGetter);

// 调用abort即可中断请求
const handleCancel = () => {
  abort();
};
```

### 频繁请求防抖
通常我们都会在频繁触发的事件层面编写防抖代码，这次我们在请求层面实现了防抖功能。


### Method对象过滤器
...

### 下载进度
...


### 上传进度
...


### 并行请求
简单的并行请求，只需要同时使用多个useRequest即可
```javascript
const {
  data: todoList
} = useRequest(todoListGetter);
const {
  data: todoCounter
} = useRequest(todoCountGetter);
```
但这样的请求只适用于单纯的并行请求，如果你需要在并行请求都完成后再进行某些操作，有两种方式可以实现。

方式1，可以手动创建promise对象，并使用`Promise.all`完成效果。
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

// 手动创建promise对象
onMounted(async () => {
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
  // 并行请求完成，继续处理业务...
});
```

方式2：使用`useRequest`函数返回的`send`函数，调用`send`将会返回一个可用的promise对象。
```javascript
// 先让它们不自动发送请求
const {
  send: sendList
} = useRequest(todoListGetter, { immediate: false });
const {
  send: sendCount
} = useRequest(todoCountGetter, { immediate: false });

// 利用send函数返回的promise对象
onMounted(async () => {
  const [
    listResponse,
    countResponse,
  ] = await Promise.all([sendList(), sendCount()]);
  // 并行请求完成，继续处理业务...
});
```

### 串行请求
可通过以下写法完成串行请求：
```javascript
// 第一个请求自动发出，第二个请求等待第一个请求完成后再触发
const {
  data: todoList,
  onSuccess,
} = useRequest(todoListGetter);
const {
  data: todoDetail,
  send: sendTodoDetail
} = useRequest(todoId => todoDetailGetter(todoId), { immediate: false });

// 先获取列表，再获取第一个todo的详情
onSuccess(todoList => {
  sendTodoDetail(todoList[0].id);
});
```

### 缓存穿透
...

### 静默提交
...


### 离线提交
...


### 持久化响应数据
...


### 让持久化数据失效
当你的某个接口设置了数据持久化并发布到了生产环境，然后因接口数据或者数据处理变动，需要在发布变动代码后让持久化数据失效，此时我们可以使用`localCache`配置的`tag`属性，每一份持久化数据都包含一个`tag`标识，当`tag`改变后原有的持久化数据就会失效，并重新获取新的数据，并用新的`tag`进行标识。
```javascript

```


### 重复请求（计划中）
...


## 高级

### Typescript支持
...

### 编写请求适配器
...


### 编写statesHook
...

### 编写存储适配器
...

### 响应状态编辑追踪（计划中）
...

## 实践示例（补充中）
...

## 插件编写（计划中）
...
