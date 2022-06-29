# [Alova](https://github.com/JOU-amjs/alova)

[![npm](https://img.shields.io/npm/v/alova)](https://www.npmjs.com/package/alova)
[![Coverage Status](https://coveralls.io/repos/github/JOU-amjs/alova/badge.svg?branch=main)](https://coveralls.io/github/JOU-amjs/alova?branch=main)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

> MVVM库的请求场景管理库（Request scene management library for MVVM libraries such as Vue.js and React.js）
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

`fetch`或`axios`往往更专注于如何与服务端交互，但对于上面的问题我们总是需要自己处理，这些有利于应用性能和稳定性的功能，总会让程序员们编写出低维护性的代码。请求场景管理就是从准备请求到响应数据加工完毕的所有环节进行抽象，从而覆盖以前端为视角的，整个CS交互生命周期的模型。`Alova`就是一个以请求场景模型的请求场景管理库。
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
- 对频繁的请求进行节流，避免前端数据闪动，以及降低服务端压力；
- 重要接口重试机制，降低网络不稳定造成的请求失败概率；
- 静默提交，当只关心提交数据时，提交请求后直接响应成功事件，后台保证请求成功；
- 离线提交，离线时将提交数据暂存到本地，网络连接后再提交；

### 请求事件
表示携带请求参数发送请求，获得响应，`Alova`可以与`axios`、`fetch`、`XMLHttpRequest`等任意请求库协作。

### 响应数据管理
`Alova`将响应数据状态化，并统一管理，任何位置都可以对响应数据进行操作，并利用MVVM库的特性自动更新对应的视图。
- 移除缓存响应数据，再次发起请求时将从服务端拉取；
- 更新缓存响应数据，可更新任意位置响应数据，非常有利于跨页面更新数据；
- 刷新响应数据，可重新刷新任意位置的响应数据，也非常有利于跨页面更新数据；
- 自定义设置缓存，在请求批量数据时，可手动对批量数据一一设置缓存，从而满足后续单条数据的缓存命中；




## 特性
1. React/Vue请求非异步用法
2. 学习成本低，与Axios相似的API
3. 响应数据状态化
4. 响应数据缓存
5. 数据预拉取
6. 静默提交
7. 离线提交
8. 请求节流
9. 轻量化gzip 3kb
10. typescript支持
11. 支持tree shaking


## 安装
```bash
# 使用npm
npm install alova --save

# 使用yarn
yarn add alova
```

## 入门指南

### 创建Alova实例
一个`Alova`实例是使用的开端，它的写法类似`Axios`，以下是一个最简单的`Alova`实例的创建方法。
```javascript
import { createAlova, VueHook, GlobalFetch } from 'alova';
const alova = createAlova({
  // 假设我们需要与这个域名的服务器交互
  baseURL: 'http://api.alovajs.org',

  // 假设我们在开发Vue项目，VueHook可以帮我们用vue的ref函数创建请求相关的，可以被Alova管理的状态，包括请求状态loading、响应数据data、请求错误对象error等（后续详细介绍）
  // 如果正在开发React项目，我们可以使用ReactHook
  statesHook: VueHook,

  // 请求适配器，我们推荐并提供了fetch请求适配器
  requestAdapter: GlobalFetch(),
});
```


### 创建请求方法对象
在`Alova`中，每个请求都对应一个method对象，它描述了一次请求的url、请求头、请求参数，以及响应数据加工、缓存加工数据、请求节流等请求行为参数。`Method`对象的创建也类似`Axios`的请求发送函数。
```javascript
// 创建一个Get对象，描述一次Get请求的信息
const Getter = alova.Get('/todo-list', {
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  },
  // params参数将会以?的形式拼接在url后面
  params: {
    userId: 1
  }
});

// 创建Post对象
const Poster = alova.Post('/create-todo', 
  // http body数据
  {
    title: 'test todo',
    time: '12:00'
  }, 
  // 请求配置相关信息放在了第三个参数
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

## 在正确的时机发送请求
在`Alova`中提供了`useRequest`、`useWatcher`、`useFetcher`三种`use hook`实现请求时机，由它们控制何时应该发出请求，同时将会为我们创建和维护状态化的请求相关数据，省去了开发者自主维护这些状态的麻烦，下面我们来了解下它们。

### useRequest
它侧重于表示一次请求的发送，执行`useRequest`时默认会发送一次请求，在页面获取初始化数据时很有用。同时我们也可以关闭它的默认发送请求，这在例如提交数据等手动触发的场景下很有用。
```javascript
// 这里我们使用上一步创建的Getter对象获取todo list数据
const {
  // 加载中状态，当加载时它的值为true，结束后自动更新为false
  // 在Vue3环境下（使用VueHook），它通过ref函数创建，你可以通过loading.value访问它，或直接绑定到界面中
  // 在React16环境下（使用ReactHook），它的值为普通的boolean值，请求状态变化时内部将调用setLoading函数更新它的值
  loading,

  // 响应数据
  data: todoList,

  // 请求错误对象，请求错误时有值，否则为null
  error
} = useRequest(Getter);
```
展示todo list数据到界面
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

提交数据场景下，关闭默认发送请求，并手动触发请求。
```javascript
const {
  loading,
  data,
  error,

  // 手动发送器请求的函数，调用后发送请求
  send,

  // 响应处理对象
  responser,
} = useRequest(Poster, {
  // 当immediate为false时，默认不发出
  immediate: false
});
```
手动触发请求
```html
<!-- Vue -->
<button @click="send">发送请求</button>

<!-- React -->
<button onClick={send}>发送请求</button>
```
如果你需要对请求响应做处理，可以使用`responser`对象，以下回调函数将会在每次请求时都触发。
```javascript
responser
  .success(responseData => {
    // TODO: 请求成功回调
  })
  .error(err => {
    // TODO: 请求错误回调
  })
  .complete(() => {
    // TODO: 请求结束回调
  });
```

### useWatcher
它侧重于监听状态变化后发送请求，在分页、数据筛选、模糊搜索等场景很有用。同时如果你希望更新服务端数据，你也可以在数据未变化时手动触发请求，手动触发方法与`useRequest`相同。以模糊搜索为例进行演示。
```javascript
// api.js
// method实例创建函数
export const filterTodoList = text => {
  return alova.Get('/tood-list', {
    params: {
      searchText: text,
      userId: 1,
    }
  });
};
```
```javascript
import { filterTodoList } from '/api';
const searchText = ref('');   // Vue3
// const [searchText, setSearchText] = useState('');   // React16

const {
  loading,
  data: todoList,
  error

  // 第一个参数为返回method实例的函数，而非method实例本身
} = useWatcher(() => filterTodoList(searchText.value), 
  // 被监听的状态数组，这些状态变化将会触发一次请求
  [searchText], {
    // 设置500ms节流
    debounce: 500,
  }
);
```
```html
<!-- searchText随着输入内容变化而变化 -->
<input v-model="seatchText"></input>
<!-- 筛选后的todo list列表 -->
<div v-for="todo in todoList">
  <div class="todo-title">{{ todo.title }}</div>
  <div class="todo-time">{{ todo.time }}</div>
</div>
```
如果要使用到分页场景，你可以这样做。
```javascript
// api.js
// method实例创建函数
export const getTodoList = currentPage => {
  return alova.Get('/tood-list', {
    params: {
      page: currentPage,
      userId: 1,
    }
  });
};
```
```javascript
import { getTodoList } from '/api';
const currentPage = ref(1);   // Vue3

const {
  loading,
  data: todoList,
  error,

  // 如果需要在监听状态未变化时刷新列表数据，也可以调用send函数手动触发
  send,

  // 第一个参数为返回method实例的函数，而非method实例本身
} = useWatcher(() => getTodoList(currentPage.value), 
  // 被监听的状态数组，这些状态变化将会触发一次请求
  [currentPage], {
    // 调用useWatcher默认不触发
    // 手动设置immediate为true可以初始获取第1页数据
    immediate: true,
  }
);
```

### useFetcher
它侧重于拉取数据，所发送的请求不返回响应数据给开发者，而是将数据暂存到响应缓存中，如果预加载的请求在之前已请求过，那它还会更新这次请求对应的响应状态。`useFetcher`的请求定位如下：
1. 预加载后续流程中将会使用到的数据，让用户不再等待数据加载的过程；
2. 跨页面刷新界面数据，例如修改todo列表的某一项，修改完成后在修改页面即可触发列表页数据的刷新；
```javascript
// 与上面两个use hook相比，它不返回data字段，但多了一个fetch函数
// 可以重复利用fetch函数拉取不同的数据，且使用同一个fetching和error等状态，从而达到统一处理的目的。
const {

  // fetching的效果与loading相同，发送拉取请求时为true，请求结束后为false
  fetching,
  error,
  responser,

  // 调用fetch后才会实际发送请求
  fetch,
} = useFetcher(alova);

// 在事件中触发数据拉取
const handleSubmit = () => {
  // 它接收一个method实例，表示需要拉取的请求相关信息
  fetch(getTodoList(1));
};
```
```html
<div v-if="fetching">{{ 正在后台拉取数据... }}</div>
```

## 响应数据管理
响应数据状态化并统一管理，我们可以在任意位置访问任意的响应数据，并对它们进行操作。

### 加工响应数据（beta）
...

### 让响应缓存腐化
... 


### 跨页面/模块更新响应数据
...


### 自定义设置缓存数据
...


## 进阶

### 设置请求超时时间
...


### 设置全局请求拦截器
...


### 设置全局响应拦截器
...


### 请求方法类型
...


### 初始化响应数据
...


### 为响应数据设置保鲜时间
...


### 手动中断请求
...


### 频繁请求节流
通常我们都会在频繁触发的事件层面编写节流代码，这次我们在请求层面实现了节流功能。


### 下载进度
...


### 上传进度
...


### 并行请求
...


### 缓存穿透
...

### 静默提交
...


### 离线提交
...


### 持久化响应数据
...

### 重复请求
...


## 高级

### 编写请求适配器
...


### 编写statesHook
。。。

### 编写存储适配器
...


## 插件编写（plan）
...