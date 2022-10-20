# [alova](https://github.com/JOU-amjs/alova)

MVVM 库的请求场景管理库，它是对请求库的一种武装，而非替代品 ✔️

[英文文档](README.md)

[![npm](https://img.shields.io/npm/v/alova)](https://www.npmjs.com/package/alova)
[![build](https://github.com/JOU-amjs/alova/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/JOU-amjs/alova/actions/workflows/main.yml)
[![coverage status](https://coveralls.io/repos/github/JOU-amjs/alova/badge.svg?branch=main)](https://coveralls.io/github/JOU-amjs/alova?branch=main)
[![minzipped size](https://badgen.net/bundlephobia/minzip/alova)](https://bundlephobia.com/package/alova)
[![dependency](https://badgen.net/bundlephobia/dependency-count/alova)](https://bundlephobia.com/package/alova)
[![tree shaking](https://badgen.net/bundlephobia/tree-shaking/alova)](https://bundlephobia.com/package/alova)
![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

## 特性

1. React/Vue/Svelte 请求非异步用法
2. 与 axios 相似的 api 设计，简单熟悉
3. 响应数据状态化
4. 响应数据缓存
5. 数据预拉取
6. 自动管理请求 key
7. 静默提交
8. 离线提交
9. 请求防抖
10. 轻量级 Gzip 4kb+
11. typescript 支持
12. tree shaking 支持
13. 状态更新追踪

## 目录

- [什么是请求场景管理](#什么是请求场景管理)
- [请求场景模型](#请求场景模型)
  - [请求时机](#请求时机)
  - [请求行为](#请求行为)
  - [请求事件](#请求事件)
  - [响应数据管理](#响应数据管理)
- [各类库的体积对比](#各类库的体积对比)
- [安装](#安装)
  - [npm](#npm)
  - [cdn](#cdn)
- [入门指南](#入门指南)
  - [创建 Alova 实例](#创建Alova实例)
  - [设置全局请求拦截器](#设置全局请求拦截器)
  - [设置全局响应拦截器](#设置全局响应拦截器)
  - [创建请求方法对象](#创建请求方法对象)
  - [请求方法类型](#请求方法类型)
  - [设置请求超时时间](#设置请求超时时间)
  - [为响应数据设置缓存时间](#为响应数据设置缓存时间)
    - [内存模式（默认）](#内存模式（默认）)
    - [持久化模式](#持久化模式)
    - [持久化占位模式](#持久化占位模式)
  - [在正确的时机发送请求](#在正确的时机发送请求)
    - [useRequest](#useRequest)
    - [useWatcher](#useWatcher)
    - [useFetcher](#useFetcher)
  - [响应数据管理](#响应数据管理)
    - [转换响应数据](#转换响应数据)
    - [主动失效响应缓存](#主动失效响应缓存)
    - [跨页面/模块更新响应数据](#跨页面/模块更新响应数据)
- [进阶](#进阶)
  - [请求方法详解](#请求方法详解)
  - [直接发送请求(v1.2.0+)](<直接发送请求(v1.2.0+)>)
  - [设置初始响应数据](#设置初始响应数据)
  - [强制发送请求](#强制发送请求)
  - [手动中断请求](#手动中断请求)
  - [请求防抖](#请求防抖)
  - [Method 对象匹配器](#Method对象匹配器)
  - [下载进度](#下载进度)
  - [上传进度](#上传进度)
  - [并行请求](#并行请求)
  - [串行请求](#串行请求)
  - [静默提交](#静默提交)
  - [离线提交](#离线提交)
  - [延迟数据更新](#延迟数据更新)
  - [自定义设置缓存数据](#自定义设置缓存数据)
- [高级](#高级)
  - [自定义请求适配器](#自定义请求适配器)
  - [自定义 statesHook](#自定义statesHook)
  - [自定义存储适配器](#自定义存储适配器)
  - [响应状态编辑追踪](#响应状态编辑追踪)
  - [Typescript 支持](#Typescript支持)
    - [usehooks 状态的类型](#usehooks状态的类型)
    - [响应数据的类型](#响应数据的类型)
    - [根据请求适配器推断的类型](#根据请求适配器推断的类型)
    - [全局请求前拦截器参数类型](#全局请求前拦截器参数类型)
    - [全局响应拦截器参数类型](#全局响应拦截器参数类型)
    - [请求适配器类型](#请求适配器类型)
    - [自定义 statesHook 的类型](#自定义statesHook的类型)
    - [全局响应拦截器参数类型](#全局响应拦截器参数类型)
- [实践示例](#实践示例)

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

`fetch`或`axios`往往更专注于如何与服务端交互，但对于上面的问题我们总是需要自己处理，这些有利于应用性能和稳定性的功能，总会让程序员们编写出低维护性的代码。请求场景管理就是从准备请求到响应数据加工完毕的所有环节进行抽象，从而覆盖以前端为视角的，整个 CS 交互生命周期的模型。`alova`就是一个以请求场景模型的请求场景管理库，它是对`axios`等请求库的一种补充，而非替代品。

> CS 交互：泛指所有客户端类型和服务端的数据交互

## 请求场景模型

![model](https://user-images.githubusercontent.com/29848971/185773583-a884e1ed-7507-4e96-9030-f20aa557eb5a.png)

### 请求时机

描述在什么时候需要发出请求，在`alova`中以`useHook`实现。

- 初始化展示数据，如刚进入某个界面或子界面；
- 人机交互触发 CS 交互，需要变更数据重新发出请求，如翻页、筛选、排序、模糊搜索等；
- 预加载数据，如分页内预先加载下一页内容、预测用户点击某个按钮后预先拉取数据；
- 操作服务端数据，需发出增删改查请求，如提交数据、删除数据等；
- 同步服务端状态，如数据变化较快的场景下轮询请求、操作了某个数据后重新拉取数据；

### 请求行为

描述以怎样的方式处理请求，在`alova`中以 method 对象实现。

- 占位请求，请求时展示 loading、骨架图、或者是上次使用的真实数据；
- 缓存高频响应，多次执行请求会使用保鲜数据；
- 多请求串行与并行；
- 对频繁的请求进行防抖，避免前端数据闪动，以及降低服务端压力；
- 重要接口重试机制，降低网络不稳定造成的请求失败概率；
- 静默提交，当只关心提交数据时，提交请求后直接响应成功事件，后台保证请求成功；
- 离线提交，离线时将提交数据暂存到本地，网络连接后再提交；

### 请求事件

表示携带请求参数发送请求，获得响应，`alova`可以与`axios`、`fetch`、`XMLHttpRequest`等任意请求库或原生方案共同协作。

### 响应数据管理

`alova`将响应数据状态化，并统一管理，任何位置都可以对响应数据进行操作，并利用 MVVM 库的特性自动更新对应的视图。

- 移除缓存响应数据，再次发起请求时将从服务端拉取；
- 更新缓存响应数据，可更新任意位置响应数据，非常有利于跨页面更新数据；
- 刷新响应数据，可重新刷新任意位置的响应数据，也非常有利于跨页面更新数据；
- 自定义设置缓存，在请求批量数据时，可手动对批量数据一一设置缓存，从而满足后续单条数据的缓存命中；

## 各类库的体积对比

| alova                                                                                                     | react-query                                                                                                           | vue-request                                                                                                           | vue                                                                                                   | react                                                                                                             |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [![minzipped size](https://badgen.net/bundlephobia/minzip/alova)](https://bundlephobia.com/package/alova) | [![minzipped size](https://badgen.net/bundlephobia/minzip/react-query)](https://bundlephobia.com/package/react-query) | [![minzipped size](https://badgen.net/bundlephobia/minzip/vue-request)](https://bundlephobia.com/package/vue-request) | [![minzipped size](https://badgen.net/bundlephobia/minzip/vue)](https://bundlephobia.com/package/vue) | [![minzipped size](https://badgen.net/bundlephobia/minzip/react-dom)](https://bundlephobia.com/package/react-dom) |

## 安装

### npm

```bash
# 使用npm
npm install alova --save

# 使用yarn
yarn add alova
```

### cdn

```html
<!-- 核心代码，全局变量为alova -->
<script src="https://unpkg.com/alova/dist/alova.umd.min.js"></script>

<!-- 预定义的请求适配器 -->
<script src="https://unpkg.com/alova/dist/adapter/globalfetch.umd.min.js"></script>

<!-- vue states hook，全局变量为VueHook，使用前需引入vue -->
<script src="https://unpkg.com/alova/dist/hooks/vuehook.umd.min.js"></script>

<!-- react states hook，全局变量为ReactHook，使用前需引入react -->
<script src="https://unpkg.com/alova/dist/hooks/reacthook.umd.min.js"></script>

<!-- svelte states hook，全局变量为SvelteHook，使用前需引入svelte和svelte/store -->
<script src="https://unpkg.com/alova/dist/hooks/sveltehook.umd.min.js"></script>
```

## 入门指南

在接下来的入门指南中，我们将以待办事项（todo）为例，围绕着获取不同日期的待办事项列表、查看 todo 详情，以及创建、编辑、删除事项等需求进行本`alova`的讲解。让我们一起往下看吧！

### 创建 Alova 实例

一个`alova`实例是使用的开端，所有的请求都需要从它开始。它的写法类似`axios`，以下是一个最简单的`alova`实例的创建方法。

```javascript
import { createAlova } from 'alova';
import GlobalFetch from 'alova/GlobalFetch';
import VueHook from 'alova/vue';
const alovaInstance = createAlova({
	// 假设我们需要与这个域名的服务器交互
	baseURL: 'https://api.alovajs.org',

	// 假设我们在开发Vue项目，VueHook可以帮我们用vue的ref函数创建请求相关的，可以被Alova管理的状态，包括请求状态loading、响应数据data、请求错误对象error等（后续详细介绍）
	// 如果正在开发React项目，我们可以通过alova/react使用ReactHook
	// 如果使用Svelte项目，我们可以通过alova/svelte使用SvelteHook
	statesHook: VueHook,

	// 请求适配器，我们推荐并提供了fetch请求适配器
	requestAdapter: GlobalFetch()
});
```

### 设置全局请求拦截器

通常，我们需要让所有请求都用上相同的配置，例如添加 token、timestamp 到请求头，`alova`为我们提供了全局的请求拦截器，它将在请求前被触发，我们可以在此拦截器中统一设置请求参数，这也与`axios`相似。

```javascript
const alovaInstance = createAlova({
	// 省略其他参数...

	// 函数参数config内包含了url、params、data、headers等请求的所有配置
	beforeRequest(config) {
		// 假设我们需要添加token到请求头
		config.headers.token = 'token';
	}
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
		// 当使用GlobalFetch请求适配器时，第一个参数接收Response对象
		// 第二个参数为请求的配置，它用于同步请求前后的配置信息
		onSuccess: async (response, config) => {
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
		// 第二个参数为请求的配置，它用于同步请求前后的配置信息
		onError: (err, config) => {
			alert(error.message);
		}
	}
});
```

如果不需要设置请求失败的拦截器，可以直接传入请求成功的拦截器函数。

```javascript
const alovaInstance = createAlova({
	// 省略其他参数...

	async responsed(response, config) {
		// 请求成功的拦截器
	}
});
```

> ⚠️ 注意：请求成功可以是普通函数和异步函数

### 创建请求方法对象

在`alova`中，每个请求都对应一个 method 对象表示，它描述了一次请求的 url、请求头、请求参数，以及响应数据加工、缓存加工数据等请求行为参数，它不会实际发出请求。`Method`对象的创建也类似`axios`的请求发送函数。
我们先来创建一个获取 todo 列表的`Method`对象，大概是这样的

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

接着再创建一个创建 todo 项的`Method`对象，大概是这样的

```javascript
// 创建Post对象
const createTodoPoster = alova.Post(
	'/todo/create',
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

> ⚠️ 注意：`Method`对象里只是保存了请求所需要的信息，但它不会发出请求，而是需要通过`use hook`发送请求，这点与`axios`不同。

### 请求方法类型

`Alova`提供了包括 GET、POST、PUT、DELETE、HEAD、OPTIONS、PATCH 七种请求方法的抽象对象，具体的使用方式可以阅读[进阶-请求方法详解](#请求方法详解)。

### 设置请求超时时间

`alova`提供了全局和请求级的超时时间设置，全局设置请求超时后，所有由`alova`创建的`Method`对象都会继承该设置。

```javascript
// 全局设置请求超时时间
const alovaInstance = createAlova({
	// 省略其他参数...

	// 请求超时时间，单位为毫秒，默认为0，表示永不超时
	timeout: 50000
});
```

在创建请求方法对象时设置请求级别的请求超时时间，它将覆盖全局的`timeout`参数。

```javascript
// 请求级别的请求超时时间
const todoListGetter = alova.Get('/todo/list', {
	// 省略其他参数...

	timeout: 10000
});
```

### 为响应数据设置缓存时间

当你在写 todo 详情页的时候，你可能会想到用户会频繁在 todo 列表中点击查看详情，如果用户重复查看某条详情时不再重复请求接口，并且能立即返回数据，那该多好，既提升了响应速度，又减小了服务器压力。此时我们就可以为某个 todo 详情`Method`对象设置响应数据缓存。默认只有`alova.Get`会带有 300000ms(5 分钟)的响应数据缓存时间，开发者也可以自定义设置。

> ⚠️ 响应数据缓存的 key：是由 method 实例的请求方法(method)、请求地址(url)、请求头参数(headers)、url 参数(params)、请求体参数(requestBody)组合作为唯一标识，任意一个位置不同都将被当做不同的 key。

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
		expire: 60 * 10 * 1000
	},

	////////////////////////
	////////////////////////
	// 因为默认是内存模式，上面的设置也可以简写成这样
	localCache: 60 * 10 * 1000
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
		tag: 'v1'
	}
});
```

> ⚠️ 缓存标签 tag 参数：出于对接口数据变动、前端处理响应数据逻辑变动原因，你需要在发布后让原持久化缓存立即失效，此时你可以设置`tag`属性，每一份持久化数据都包含一个`tag`标识，当`tag`改变后原有的持久化数据就会失效，并重新获取新的数据，并用新的`tag`进行标识。

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
		tag: 'v1'
	}
});
```

以上缓存设置同样支持请求级别，在创建请求方法对象上设置`localCache`参数来达到目的，设置方法相同。

```javascript
const todoListGetter = alova.Get('/todo/list', {
	// 省略其他参数...

	// 参数用法与全局相同
	localCache: 60 * 10 * 1000
});
```

## 在正确的时机发送请求

接下来我们要来看看如何实际发出请求了，在`alova`中提供了`useRequest`、`useWatcher`、`useFetcher`三种`use hook`实现请求时机，由它们控制何时应该发出请求，同时将会为我们创建和维护状态化的请求相关数据，如`loading`、`data`、`error`等，省去了开发者自主维护这些状态的麻烦，下面我们来了解下它们。

### useRequest

它表示一次请求的发送，执行`useRequest`时默认会发送一次请求，在页面获取初始化数据时是最常用的方法。同时也支持关闭它的默认的请求发送，这在例如提交数据等通过点击事件触发的场景下非常有用。下面我们来发出对 todo 列表数据的请求。

```javascript
const {
	// loading是加载状态值，当加载时它的值为true，结束后自动更新为false
	// Vue3环境下（使用VueHook）：它是一个Ref类型的值，你可以通过loading.value访问它，或直接绑定到界面中
	// React16环境下（使用ReactHook）：它的值为普通的boolean值，请求状态变化时内部将调用setLoading函数更新它的值
	// 在Svelte环境下（使用SvelteHook）：它是一个Writable类型的值，内部将维护它的值
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
	onComplete

	// 直接将Method对象传入即可发送请求
} = useRequest(todoListGetter, {
	// 初始data数据
	initialData: []
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

你可以直接使用 todoList 来渲染 todo 列表

```html
<div v-if="loading">Loading...</div>
<div
	v-else-if="error"
	class="error">
	{{ error.message }}
</div>
<template v-else>
	<div v-for="todo in todoList">
		<div class="todo-title">{{ todo.title }}</div>
		<div class="todo-time">{{ todo.time }}</div>
	</div>
</template>
```

当你需要创建一条新的 todo 项时，可以先关闭默认发送请求，转为手动触发请求。然后将 useRequest 的第一个参数改为返回`Method`对象的函数，该函数在触发请求时被调用。

```javascript
const createTodoPoster = newTodo => alova.Post('/todo', newTodo);

const {
	loading,
	data,
	error,

	// 手动发送器请求的函数，调用后发送请求
	send: addTodo
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

它用于监听指定的状态变化，然后立即发送请求，在分页、数据筛选、模糊搜索等场景很有用。同时如果你希望更新服务端数据，接下来我们以搜索 todo 项为例。

```javascript
// 创建method实例
const filterTodoList = text => {
	return alova.Get('/tood/list/search', {
		params: {
			searchText: text
		}
	});
};
const searchText = ref(''); // Vue3
// const [searchText, setSearchText] = useState('');   // React16

const {
	loading,
	data: todoList,
	error

	// 第一个参数必须为返回method实例的函数
} = useWatcher(
	() => filterTodoList(searchText.value),

	// 被监听的状态数组，这些状态变化将会触发一次请求
	[searchText],
	{
		// 设置500ms防抖，如果searchText频繁变化，只有在停止变化后500ms才发送请求
		debounce: 500
	}
);
```

```html
<!-- searchText随着输入内容变化而变化 -->
<input v-model="searchText" />

<!-- 渲染筛选后的todo列表 -->
<div v-if="loading">Loading...</div>
<template v-else>
	<div v-for="todo in todoList">
		<div class="todo-title">{{ todo.title }}</div>
		<div class="todo-time">{{ todo.time }}</div>
	</div>
</template>
```

如果要用在 todo 列表分页请求，你可以这样做。

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

const currentPage = ref(1); // Vue3
const {
	loading,
	data: todoList,
	error

	// 第一个参数为返回method实例的函数，而非method实例本身
} = useWatcher(
	() => getTodoList(currentPage.value),
	// 被监听的状态数组，这些状态变化将会触发一次请求
	[currentPage],
	{
		// ⚠️调用useWatcher默认不触发，注意和useRequest的区别
		// 手动设置immediate为true可以初始获取第1页数据
		immediate: true
	}
);
```

> ⚠️ 如果你只希望重新请求当前页的数据（可能是数据更新了），你也可以手动触发请求，用法和`useRequest`相同。

### useFetcher

它用于拉取数据，响应数据不能直接接收到，`useFetcher`的使用场景如下：

1. 预加载后续流程中将会使用到的数据并存放在缓存中，让用户不再等待数据加载的过程；
2. 跨页面刷新界面数据，拉取的数据在页面中存在渲染时，它除了会更新缓存外还会更新响应状态，让界面刷新，例如修改 todo 列表的某一项后重新拉取最新数据，响应后将会刷新界面。

与`useRequest`和`useWatcher`相比，`useFetcher`不返回`data`字段，将`loading`改名为了`fetching`，也没有`send`函数，但多了一个`fetch`函数，可以重复利用 fetch 函数拉取不同的数据，且使用同一个 fetching 和 error 等状态，从而达到统一处理的目的。

下面我们来实现修改某个 todo 数据，并重新拉取最新的 todo 列表数据，让界面刷新。

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
	fetch
} = useFetcher();

// 在事件中触发数据拉取
const handleSubmit = () => {
	// 假设已完成todo项的修改...

	// 开始拉取更新后的数据
	// 情况1：当你明确知道拉取todoList第一页数据时，传入一个Method对象
	fetch(getTodoList(1));

	// 情况2：当你只知道拉取todoList最后一次请求的数据时，通过Method对象匹配器来筛选
	fetch({
		name: 'todoList',
		filter: (method, index, ary) => {
			// 返回true来指定需要拉取的Method对象
			return index === ary.length - 1;
		}
	});
};
```

界面中还可以渲染统一的拉取状态。

```html
<div v-if="fetching">{{ 正在后台拉取数据... }}</div>
<!-- 省略todo参数设置相关的html -->
<button @click="handleSubmit">修改todo项</button>
```

`useFetcher` 请求完成后只更新缓存，且如果发现该`Method`对象下还有`data`状态，也会同步更新它，从而保证页面数据一致。它默认忽略缓存强制发起请求，你也可以通过以下方式关闭。
```javascript
useFetcher({
  force: false
});
```

更多关于强制发送请求的内容，查看 [进阶-强制发送请求](#强制发送请求)

至于`Method`对象匹配器，详细的使用方法见 [进阶-Method对象匹配器](#Method对象匹配器)

## 响应数据管理

响应数据状态化并统一管理，我们可以在任意位置访问任意的响应数据，并对它们进行操作。

### 转换响应数据

当响应数据结构不能直接满足前端需求时，我们可以为 method 实例设置`transformData`钩子函数将响应数据转换成需要的结构，数据转换后将会作为`data`状态的值。

```javascript
const todoListGetter = alova.Get('/tood/list', {
	params: {
		page: 1
	},

	// 函数接受未加工的数据和响应头对象，并要求将转换后的数据返回，它将会被赋值给data状态。
	// 注意：rawData一般是响应拦截器过滤后的数据，响应拦截器的配置可以参考[设置全局响应拦截器]章节。
	transformData(rawData, headers) {
		return rawData.list.map(item => {
			return {
				...item,
				statusText: item.done ? '已完成' : '进行中'
			};
		});
	}
});
```

### 主动失效响应缓存

有这样一个场景，当用户点开 todo 列表中的某一项，进入 todo 详情页并对它执行了编辑，此时我们希望上一页中的 todo 列表数据也更新为编辑后的内容，通常的做法是通过事件来触发上一页的内容更新，这样增加了维护成本。而`alova`提供了 3 种方式，可以很优雅地达到这个目的：

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

它的功能还远不止于此，我们还可以通过设置`Method`对象匹配器来实现多个，甚至全部的缓存失效。

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
		}
	});

	// 不传任何参数时，失效所有响应缓存
	invalidateCache();
});
```

详细的`Method`对象匹配器使用方法见 [进阶-Method 对象匹配器](#Method对象匹配器)

### 跨页面/模块更新响应数据

我们继续以上一小节[主动失效响应缓存](#主动失效响应缓存)中提到的例子来说，当用户点开 todo 列表中的某一项，进入 todo 详情页并对它执行了编辑，此时我们希望上一页中的 todo 列表数据也更新为编辑后的内容，使用`useFetcher`和`invalidateCache`的方式都会重新发起请求，那有没有不需要重新请求的方法呢？

当然有！

```javascript
import { updateState } from 'alova';

// 正在编辑的todo项
const editingTodo = {
	id: 1,
	title: 'todo1',
	time: '09:00'
};

const { send, onSuccess } = useRequest(createTodoPoster, { immediate: false });

// 提交成功后，固定使第一页的todo数据缓存失效
onSuccess(() => {
	// 提交成功后，固定修改第一页的todo数据数据
	// 第一个参数为Method对象，第二个为包含原缓存数据的回调函数，该函数需要返回修改后的数据
	updateState(getTodoList(1), todoList => {
		return todoList.map(item => {
			if (item.id === editingTodo.id) {
				return {
					...item,
					...editingTodo
				};
			}
			return item;
		});
	});
});
```

> 1. 自主修改缓存数据时，不仅会更新对应的响应式状态，如果存在持久化缓存也会一起被更新。
> 2. 只有当使用 useRequest、useWatcher 发起过请求时，alova 才会管理 hook 返回的状态，原因是响应状态是通过一个 Method 对象来生成 key 并保存的，但在未发起请求时 Method 对象内的 url、params、query、headers 等参数都还不确定。

可能有时候你会希望在静默提交 todo 创建数据时，立即调用`updateState`更新数据，并且还希望在 todo 项创建完成后再次把`id`更新上去，你可以深入了解 [延迟数据更新](#延迟数据更新)

## 进阶

### 请求方法详解

`Alova`实例对象提供了七种请求方法的抽象对象，包括 GET、POST、PUT、DELETE、HEAD、OPTIONS、PATCH。

- GET: `alova.Get(url[, config])`;
- POST: `alova.Post(url[, data[, config]])`;
- PUT: `alova.Put(url[, data[, config]])`;
- DELETE: `alova.Delete(url[, data[, config]])`;
- HEAD: `alova.Head(url[, config])`;
- OPTIONS: `alova.Options(url[, config])`;
- PATCH: `alova.Patch(url[, data[, config]])`;

参数说明：

- `url`是请求路径，它将会与`createAlova`中的`baseURL`拼接成完整的 url 进行请求；
- `data`为请求体数据对象；
- `config`为请求配置对象，其中包含了请求头、params 参数等、请求行为参数等配置；

### 直接发送请求(v1.2.0+)

有时候我们只想要简单地发出请求，并不需要各种状态，此时可以直接调用`Method`对象的`send`函数即可，它将返回一个带返回参数的`Promise`对象。

```javascript
// 获取全局的用户信息
const globalUserGetter = alova.Get('/global/user', {
	params: {
		userId: 1
	},
	transformData(rawData, headers) {
		return {
			data: rawData,
			respHeaders: headers
		};
	}
});

// send方法接收一个参数，表示是否强制请求，默认为false
const { data, respHeaders } = await globalUserGetter.send(true);
// 使用数据...
```

⚠️ 需要注意的是：

1. 返回的响应数据也会依次被全局的`responsed`和当前`Method`对象的`transformData`处理；
2. 缓存机制依然有效，如果命中缓存也会返回缓存数据，此时可以在`send`方法中传入`true`来强制发起请求；

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
} = useWatcher(
	() => getTodoList(/* 参数 */),
	[
		/* 监听状态 */
	],
	{
		initialData: []
	}
);
```

### 强制发送请求
当你在使用`alova`的use hooks时，有时候希望在命中缓存时也可以发送请求，此时可以用use hook配置中的`force`参数，使用方法如下：
```javascript
useRequest(methodInstance, {
  force: true,
});

// 如果force需要动态变更，可设置为一个返回boolean值的函数，它将在每次请求时触发
// useRequest、useWatcher、useFetcher都支持
const force = { value: false };
useWatcher(() => methodInstance, [...], {
  force: () => force.value
});

useFetcher({
  force: false,  // 或() => force.value
});
```
值得注意的是，`useRequest`、`useWatcher`的force值默认为false，而`useFetcher`的force值默认为true。

### 手动中断请求

未设置`timeout`参数时请求是永不超时的，如果需要手动中断请求，可以在`useRequest`、`useWatcher`函数被调用时接收`abort`方法。

```javascript
const {
	// 省略其他参数...

	// abort函数用于中断请求
	abort
} = useRequest(todoListGetter);

// 调用abort即可中断请求
const handleCancel = () => {
	abort();
};
```

### 请求防抖

通常我们都会在频繁触发的事件层面编写防抖代码，这次我们在请求层面实现了防抖功能，这意味着你再也不用在模糊搜索功能中自己实现防抖了，用法也非常简单。

```javascript
const searchText = ref(''); // Vue3
const {
	loading,
	data: todoList,
	error
} = useWatcher(() => filterTodoList(searchText.value), [searchText], {
	// 设置debounce属性，单位为毫秒
	// 如这边的searchText频繁变化，只有在停止变化后500ms才发送请求
	debounce: 500
});
```

### Method 对象匹配器

当我们在处理完一些业务时，需要调用`invalidateCache`、`setCacheData`、`updateState`和`fetch`来失效缓存、更新缓存、跨页面更新状态、或重新拉取数据，一般会有两种场景：

1. 开发者知道需要操作哪个请求的数据，此时在调用上面的函数时直接传入一个`Method`对象即可；
2. 开发者只知道需要操作某个顺序位的请求，而不确定具体哪个，此时我们就可以使用`Method`对象匹配器的方式过滤出来。

`Method`对象匹配器是依据`Method`对象设置的`name`属性来过滤的，多个匹配器允许设置相同的`name`，因此首先需要为需要过滤的`Method`对象设置`name`属性。

```javascript
// 每次调用getTodoList时都会生成一个新的Method对象，它们的name是相同的
const getTodoList = currentPage =>
	alova.Get('/tood/list', {
		name: 'todoList',
		params: {
			currentPage,
			pageSize: 10
		}
	});
```

其次，我们在调用`invalidateCache`、`setCacheData`、`updateState`、`fetch`函数时传入匹配器即可，完整的`Method`对象匹配器的格式如下：

```javascript
type MethodFilter = {
	name: string | RegExp,
	filter: (method: Method, index: number, methods: Method[]) => boolean,

	// 可选参数，如果传入alova对象则只匹配此alova所创建的Method对象，否则匹配所有alova实例的Method对象
	alova?: Alova
};
```

`name`表示需要匹配的`Method`对象，它匹配出来是一个数组，然后通过`filter`过滤函数筛选出最终使用的`Method`对象集合，`filter`函数返回 true 表示匹配成功，返回 false 表示失败，让我们来看几个例子。

```javascript
// 以下表示匹配name为'todoList'的所有Method对象，并失效它们的缓存
invalidateCache({
	name: 'todoList',
	filter: (method, index, methods) => true
});

// 以下表示匹配alova1实例创建的，name为以'todo'开头的所有Method对象
invalidateCache({
	name: /^todo/,
	filter: (method, index, methods) => true,
	alova: alova1
});

// 如果不需要设置过滤函数，也可以直接传入一个字符串或者正则表达式
invalidateCache('todoList');
invalidateCache(/^todo/);

// 以下表示重新拉取todo列表最后一次请求的数据
const { fetch } = useFetcher();
fetch({
	name: 'todoList',
	filter: (method, index, methods) => index === methods.length - 1
});
```

要特别注意的是，`invalidateCache`会失效所有过滤出来的`Method`对象所对应的缓存，而`updateState`和`fetch`只会使用`Method`对象集合中的第一个项进行操作。

### 下载进度

在获取下载进度前，你需要在指定`Method`对象上启用下载进度，然后在`useRequest`、`useWatcher`、`useFetcher`三个 use hook 中接收`downloading`响应式状态，下载过程中将持续更新这个状态。

```javascript
const downloadGetter = alova.Get('/tood/downloadfile', {
	enableDownload: true
});
const { dowinlading } = useRequest(downloadGetter);
```

```html
<div>文件大小：{{ downloading.total }}B</div>
<div>已下载：{{ downloading.loaded }}B</div>
<div>进度：{{ downloading.loaded / downloading.total * 100 }}%</div>
```

### 上传进度

上传进度与下载进度使用方法相同，先启用再通过接收`uploading`响应式状态。

```javascript
const uploadGetter = alova.Get('/tood/uploadfile', {
	enableUpload: true
});
const { uploading } = useRequest(uploadGetter);
```

```html
<div>文件大小：{{ uploading.total }}B</div>
<div>已上传：{{ uploading.loaded }}B</div>
<div>进度：{{ uploading.loaded / uploading.total * 100 }}%</div>
```

> ⚠️ 因 fetch api 限制，`alova`库提供的`GlobalFetch`适配器不支持上传进度，如需要上传进度，请自行编写请求适配器，详见 [高级-编写请求适配器](#编写请求适配器)。

### 并行请求

简单的并行请求，只需要同时使用多个 useRequest 即可

```javascript
const { data: todoList } = useRequest(todoListGetter);
const { data: todoCounter } = useRequest(todoCountGetter);
```

但这样的请求只适用于单纯的并行请求，如果你需要在并行请求都完成后再进行某些操作，有两种方式可以实现。

方式 1：可以手动创建 promise 对象，并使用`Promise.all`完成效果。

```javascript
const { data: todoList, onSuccess: onListSuccess, onError: onListError } = useRequest(todoListGetter);
const { data: todoCounter, onSuccess: onCountSuccess, onError: onCountError } = useRequest(todoCountGetter);

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
	const [listResponse, countResponse] = await Promise.all([listPromise, countPromise]);
	// 并行请求完成，继续处理业务...
});
```

方式 2：使用`useRequest`函数返回的`send`函数，调用`send`将会返回一个可用的 promise 对象。

```javascript
// 先让它们不自动发送请求
const { send: sendList } = useRequest(todoListGetter, { immediate: false });
const { send: sendCount } = useRequest(todoCountGetter, { immediate: false });

// 利用send函数返回的promise对象
onMounted(async () => {
	const [listResponse, countResponse] = await Promise.all([sendList(), sendCount()]);
	// 并行请求完成，继续处理业务...
});
```

### 串行请求

可通过以下写法完成串行请求：

```javascript
// 第一个请求自动发出，第二个请求等待第一个请求完成后再触发
const { data: todoList, onSuccess } = useRequest(todoListGetter);
const { data: todoDetail, send: sendTodoDetail } = useRequest(todoId => todoDetailGetter(todoId), { immediate: false });

// 先获取列表，再获取第一个todo的详情
onSuccess(todoList => {
	sendTodoDetail(todoList[0].id);
});
```

### 静默提交

假设你想要进一步提高创建 todo 项的体验感，让用户点击“创建”按钮后立即生效，而感觉不到提交服务器的过程，你可以考虑使用静默提交的方式。

你可能会想，服务器没有响应就可以把结果呈现给用户了吗？是的，`alova`具有后台请求可靠机制，在网络连接环境下间隔 2 秒重复发起请求，直到请求顺利完成，这在服务提供不稳定的时候很有效，当然，还是需要提醒你的是，不稳定的情况下，如果你的数据在多端展示时，可能就会有点不同步了。

我们来展示一下静默创建 todo 项的代码。

```javascript
const createTodoPoster = newTodo => alova.Post('/todo/create', newTodo);

const { send, onSuccess } = useRequest(createTodoPoster, {
	// 在请求时开启静默提交
	silent: true
});
onSuccess(() => {
	// 设置为静默提交后，onSuccess将会立即被调用，并且回调函数的第一个参数为undefined
	// 而onError将永远不会被调用
	// 立即将新todo项添加到列表中
	updateState(todoListGetter, todoList => [...todoList, newTodo]);
});

// 点击创建按钮触发此函数
const handleSubmit = () => {
	send({
		title: 'test todo',
		time: '12:00'
	});
};
```

上面的静默提交会有一个问题，就是新的 todo 项没有 id，而 id 一般需要等提交返回才行，此时我们可以使用延迟数据更新。

```javascript
// 省略其他代码...
onSuccess(() => {
	updateState(todoListGetter, todoList => [
		...todoList,
		{
			// id设为占位符，等待响应后将自动替换为实际数据
			'+id': ({ id }) => id,
			...newTodo
		}
	]);
});
```

深入了解[延迟数据更新](#延迟数据更新)

### 离线提交

如果你正在开发一个在线文档编写器，用户的每次输入都需要自动同步到服务端，即使是离线状态下也支持用户继续编写，在这种场景下，我们可以使用`alova`的离线提交机制，其实这个功能和静默提交功能是一体化的，都是得益于`alova`的后台请求可靠机制。

它的处理方式是，当开启了静默提交后，在离线状态时提交数据会直接将请求数据缓存在本地，等到网络恢复后，会自动将缓存的请求数据重新提交到服务端，这就保证了离线状态下的静默提交也是可靠的。

接下来我们以在线文档编写器为示例，展示一下离线提交的代码。

```javascript
const editingText = ref('');
const saveDoc = () =>
	alova.Post('/doc/save', {
		text: editingText.value
	});
const { loading } = useWatcher(saveDoc, [editingText], {
	// 开启静默提交
	silent: true,

	// 设置500ms防抖降低服务器压力
	debounce: 500
});
```

```html
<div v-if="loading">提交中...</div>
<textarea v-model="editingText"></textarea>
```

这样就完成了简单的在线文档编写器。当然，在静默提交创建 todo 项的例子中离线提交也是适用的，即在离线状态下也能保证顺利创建 todo 项。

### 延迟数据更新

你可能会有这样的需求：创建一个 todo 项时设为静默提交，并立即调用`updateState`更新 todo 列表，这样虽然可以立即在界面上看到新增的 todo 项，但还没有 id，因此这个 todo 项无法被编辑和删除，除非重新请求完整数据。

延迟数据更新就是用来解决这个问题的，它支持你用一种占位格式来标记 id 字段，在响应前会将占位符替换为`default`值或`undefined`，然后在响应后自动把实际数据替换占位标记。

```javascript
const newTodo = {
  title: '...',
  time: '10:00'
};
const { onSuccess } = useRequest(/*...*/);  // 静默提交
onSuccess(() => {
  updateState(/*...*/, todoList => {
    const newTodoWithPlaceholder = {
      // 占位格式完整写法
      id: {
        // action的值是固定写法
        action: 'responsed',

        // 延迟更新的getter函数
        // 它将在响应后调用并将返回值替换到id属性上，res参数是响应数据
        value: res => res.id,

        // 数据更新前的默认值，可选项，不设时为undefined
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

以上`newTodoWithPlaceholder`数据在响应前将会被编译成如下的值，此时 todo 列表页可以立即展示新的 todo 项。

```javascript
{
  id: 0,  // 因为设置了请求前的默认值
  title: '...',
  time: '10:00',
};
```

响应后 id 将被 getter 函数的返回值替换，此时新的 todo 项也支持编辑和删除等操作了。

```javascript
// 假设响应数据为  { id: 10 }
{
  id: 10,
  title: '...',
  time: '10:00',
};
```

延迟数据占位符可以用在任意位置。

用在数组中

```javascript
[1, 2, { action: 'responsed', value: res => res.id }][
	// 响应前的数据
	(1, 2, undefined)
][
	// 响应后的数据
	// 假设响应数据为  { id: 10 }
	(1, 2, 10)
];
```

用在对象上

```javascript
{
  a: {  action: 'responsed', value: res => res.id },
  b: {  action: 'responsed', value: res => res.id, default: 1 },
}
// 占位符设置到对象属性上时，可如下简写
// key以“+”开头
{
  '+a': res => res.id,  // 只设置了getter函数
  '+b': [res => res.id, 1],   // 设置了getter函数和默认值
}

// 响应前的数据
{
  a: undefined,
  b: 1,
}

// 响应后的数据
// 假设响应数据为  { id: 10 }
{
  a: 10,
  b: 10,
}
```

用在非数组和对象上

```javascript
// 直接以占位符表示
{
  action: 'responsed',
  value: res => res.data,
  default: { name: '', age: 0 }
}

// 响应前的数据
{ name: '', age: 0 }

// 响应后的数据
// 假设响应数据为  { data: { name: 'Tom', age: 18 } }
{ name: 'Tom', age: 18 }
```

用在数组和对象的组合中

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

// 响应前的数据
[
  1,
  12,
  res => res.id,  // 简写只能在+为前缀key的对象中使用，因此不编译
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

// 响应后的数据
// 假设响应数据为  { id: 10 }
[
  1,
  10,
  res => res.id,  // 简写只能在+为前缀key的对象中使用，因此不编译
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

> ⚠️ 限制 1：延迟数据更新只有在静默模式下，且在`onSuccess`回调函数中同步调用`updateState`函数有效，否则可能会造成数据错乱或报错。

> ⚠️ 限制 2：如果`updateState`更新后的值中有循环引用的，延迟数据更新将不再生效

### 自定义设置缓存数据

**一般地，有两种情况需要自定义设置缓存数据**

情况 1：有些服务接口支持批量请求数据，它意味着总是由不确定的若干组响应数据组成，当我们想要在初始化页面时批量请求数据，然后在交互中只请求单条数据的情况下，会造成缓存穿透的问题。

例如我们需要按日期获取 todo 列表数据，在初始化时一次请求获取了 5 月 1 日到 5 日，5 天的数据，然后用户在操作时又获取了一次 5 月 1 日的数据，此时不会命中初始化时的 5 月 1 日数据，因为初始化的 5 天数据是存放在一起的，而不是分开缓存的，此时我们就可以为这 5 天的数据一一手动创建单条的响应缓存，这样就可以解决单条数据请求时的缓存穿透的问题。

```javascript
import { setCacheData } from 'alova';

const getTodoListByDate = dateList =>
	alova.Get('/todo/list/dates', {
		params: { dateList }
	});
// 初始化时批量获取5天的数据
const dates = ref(['2022-05-01', '2022-05-02', '2022-05-03', '2022-05-04', '2022-05-05']);
const {
	// ...
	onSuccess
} = useWatcher(() => getTodoListByDate(dates.value.join()), [dates], {
	immediate: true
});
onSuccess(todoListDates => {
	if (todoListDates.length <= 1) {
		return;
	}

	// 默认情况下，这5天的数据会一起缓存到一个key中
	// 为了让后续请求某一天的数据时也能命中缓存，我们可以将5天的数据拆解为按天，并通过setCacheData一一手动设置响应缓存
	// setCacheData的第一个参数为method实例对象，它用于指定缓存的key
	// 第二个参数为缓存数据
	todoListDates.forEach(todoDate => {
		setCacheData(getTodoListByDate(todoDate.date), [todoDate]);
	});
});
```

此时再在切换日期为5月1日时，它将会命中我们手动设置的响应缓存。

```javascript
const handleTodolistToggle = () => {
	// dates值正在被useWatcher监听，因此改变它就可以自动触发请求
	dates.value = ['2022-05-01'];
};
```

情况二：分页请求数据时，因翻页而产生多个`Method`对象，导致渲染列表的`data`数据状态往往对应多个响应缓存，如果你编辑完成一条数据后，希望立即让列表更新，而不希望再重新请求接口更新列表，此时你就可以调用`updateState`函数，同时修改`data`数据状态和对应的缓存，但如果此时你希望修改的数据不是本页的数据，或涉及多页的数据，此时你就可以调用`setCacheData`来修改缓存，保证下次再展示指定页的数据时，数据是更新的。

例如，有一组带分类名的列表数据，你希望在浏览了几页后修改分类名，并立即更新缓存内的数据，而非重新拉取数据，此时你可以这样写

```javascript
const todoListGetter = page =>
	alova.Get('/todo/list', {
		name: 'todoList', // 设置Method对象的名称，setCacheData中可通过名称批量修改缓存
		params: {
			userId: 1,
			page
		}
	});

const page = ref(1);
const { data: todoList } = useWatcher(() => todoListGetter(page), [page]);

// 确认修改分类名事件回调
const confirmCategoryNameChange = categoryName => {
	// setCacheData第一个参数可传入Method对象，或Method对象匹配器
	// 第二个参数可以接收更新函数，当匹配到多个Method对象时，此函数将被调用多次，函数参数为旧缓存，并要求返回更新后的缓存
	setCacheData('todoList', oldCache => {
		return {
			...cacheItem,
			categoryName
		};
	});
};
```

> 在某些特殊情况下，你可能需要根据条件判断是否更新缓存，此时可返回`false`来中断本次的更新。

`Method`对象匹配器的详细使用方法见 [进阶-Method 对象匹配器](#Method对象匹配器)

## 高级

### 自定义请求适配器

还记得你如何创建一个 Alova 实例吗？在调用`createAlova`时必须传入`requestAdapter`，这个就是`alova`的请求适配器，试想当`alova`运行在非浏览器环境时（可能是客户端、小程序），`fetch api`可能不再可用，那我们就需要更换一个支持当前环境的请求适配器。

那应该如何自定义一个请求适配器呢？很简单，它其实是一个函数，在每次发起请求时都会调用此函数，并返回一个对象，这个对象内包含如`url`、`method`、`data`、`headers`、`timeout`等请求相关的数据集合，虽然字段较多，但我们只需访问我们需要的数据即可。

请求适配器的参数类型，以及支持 Typescript 的写法，可以 [点此查看说明](#请求适配器类型)。

一个简单的请求适配器是这样的：

```javascript
function customRequestAdapter(config) {
	// 解构出需要用到的数据
	const { url, method, data, headers } = config;

	// 发送请求
	const fetchPromise = fetch(url, {
		method: method,
		headers: headers,
		body: data
	});

	// 返回一个包含请求操作相关的对象
	return {
		response: () => fetchPromise,
		headers: () => fetchPromise.then(res => res.headers),
		abort: () => {
			// TODO: 中断请求...
		},
		onDownload: updateDownloadProgress => {
			let loaded = 0;
			let timer = setInterval(() => {
				updateDownloadProgress(1000, (loaded += 1000));
				if (loaded >= 1000) {
					clearInterval(timer);
				}
			}, 100);
		},
		onUpload: updateUploadProgress => {
			let loaded = 0;
			let timer = setInterval(() => {
				updateUploadProgress(1000, (loaded += 1000));
				if (loaded >= 1000) {
					clearInterval(timer);
				}
			}, 100);
		}
	};
}
```

请求适配器的返回值说明：

1. 【必填】response 函数：一个异步函数，函数返回响应值，它将会传递给全局的响应拦截器 responsed；
2. 【必填】headers 函数：一个异步函数，函数返回的响应头对象将传递给 Method 对象的 transformData 转换钩子函数；
3. 【必填】abort 函数：一个普通函数，它用于中断请求，在 [手动中断请求](#手动中断请求) 章节中调用`abort`函数时，实际上触发中断请求的函数就是这个中断函数；
4. 【可选】onDownload 函数：一个普通函数，它接收一个更新下载进度的回调函数，在此函数内自定义进度更新的频率，在此示例中模拟每隔 100 毫秒更新一次。`updateDownloadProgress`回调函数接收两个参数，第一个参数是总大小，第二个参数是已下载大小；
5. 【可选】onUpload 函数：一个普通函数，它接收一个更新上传进度的回调函数，在此函数内自定义进度更新的频率，在此示例中模拟每隔 100 毫秒更新一次。`updateUploadProgress`回调函数接收两个参数，第一个参数是总大小，第二个参数是已上传大小；

建议你可以查阅 [GlobalFetch 源码](https://github.com/JOU-amjs/alova/blob/main/src/predefine/GlobalFetch.ts) 来了解更多关于请求适配器的细节。

### 自定义 statesHook

还记得你在调用`createAlova`时传入的`statesHook`吗？它将决定你在请求时返回哪个 MVVM 库的状态，如在 vue 项目中使用`VueHook`，在 react 项目中使用`ReactHook`，在 svelte 项目中使用`SvelteHook`，目前只支持这三个库。在大部分情况下你应该用不到这个功能，但如果你需要适配更多我们还不支持的 MVVM 库，就需要自定义编写`statesHook`了。

`statesHook`是一个包含特定函数的普通对象，不过这些还是基本不涉及算法，我们来看看 VueHook 是怎么编写的吧。

```javascript
import { ref, watch, onUnmounted } from 'vue';

const VueHook = {
	// 状态创建函数
	create: rawData => ref(data),

	// 状态导出函数
	export: state => state,

	// 脱水函数
	dehydrate: state => state.value,

	// 响应式状态更新函数
	update: (newVal, states) => {
		Object.keys(newVal).forEach(key => {
			states[key].value = newVal[key];
		});
	},

	// 请求发送控制函数
	effectRequest({ handler, removeStates, saveStates, immediate, frontStates, watchingStates }) {
		// 组件卸载时移除对应状态
		onUnmounted(removeStates);

		// 调用useRequest和useFetcher时，watchingStates为undefined
		if (!watchingStates) {
			handler();
			return;
		}

		// 调用useWatcher时，watchingStates为需要监听的状态数组
		// immediate为true时，表示需要立即发送请求
		watch(watchingStates, handler, { immediate });
	}
};
```

自定义`statesHook`各个函数说明：

1. 【必填】create 函数：响应式状态创建函数，`loading`、`error`、`data`、`downloading`、`uploading`等都是调用此函数创建的，如 vue3 项目下将创建为 ref 值；
2. 【必填】export 函数：状态导出函数，此函数接收 create 函数创建的响应式状态，并导出最终给开发者使用的状态，这里`VueHook`导出的状态是原状态；
3. 【必填】dehydrate 函数：脱水函数，意思是将响应式状态转换为普通数据，与 create 是相反的操作，在`updateState`中；
4. 【必填】update 函数：响应式状态更新函数，`alova`内部维护的状态更新都是通过此函数完成。此函数接收两个参数，第一个参数是新的数据对象，第二个参数是原响应式状态的 map 集合，这里你可以固定写一个循环更新`states`；
5. 【必填】effectRequest 函数：请求发送控制函数，它会在`useRequest`、`useWatcher`、`useFetcher`被调用时立即执行此函数，我们要在这个函数内要完成三件事：
   1. 当前组件卸载时，调用 removeStates 函数移除当前组件涉及到的响应式状态，避免内存溢出;
   2. 当调用 useWatcher 时，绑定状态监听，状态改变时调用 sendRequest 函数，你可以用`states`是否为数组判断是否为`useWatcher`被调用，同时，`immediate`参数用于判断`useWatcher`调用时是否需要立即发送请求；
   3. 当调用`useRequest`和`useFetcher`时，调用 sendRequest 发出一次请求，此时`states`为`undefined`；

> ⚠️ 注意：如果 statesHook 涉及的库是像`react`，每次重新渲染都会调用`alova`的 use hook 的，那么在`effectRequest`中还需要在每次重新渲染时触发`saveStates`函数，这是因为`react`每次重新渲染都会刷新它的状态引用，因此我们需要再次重新保存它们。

[ReactHook 源码点此查看](https://github.com/JOU-amjs/alova/blob/main/src/predefine/ReactHook.ts)

如果你在自定义 statesHook 后，也希望它可以支持 typescript，可以 [点此查看](#自定义statesHook的类型)

### 自定义存储适配器

`alova`中涉及多个需要数据持久化的功能，如持久化缓存、静默提交和离线提交。在默认情况下，`alova`会使用`localStorage`来存储持久化数据，但考虑到非浏览器环境下，因此也支持了自定义。

自定义存储适配器同样非常简单，你只需要指定保存数据、获取数据，以及移除数据的函数即可，大致是这样的。

```javascript
const customStorageAdapter = {
	setItem(key, value) {
		// 保存数据
	},
	getItem(key) {
		// 获取数据
	},
	removeItem(key) {
		// 移除数据
	}
};
```

然后在创建`alova`实例时传入这个适配器即可。

```javascript
const alovaInstance = createAlova({
	// ...
	storageAdapter: customStorageAdapter
});
```

### 响应状态编辑追踪

敬请期待

### Typescript 支持

在 Typescript 方面，我们确实花了很大的精力优化，为的就是提供更好的使用体验，我们尽力地使用自动推断类型来减少你定义类型的次数。

#### usehooks 状态的类型

在`createAlova`创建 alova 实例时会根据传入的`statesHook`自动推断出`useRequest`、`useWatcher`、`useFetcher`所创建的状态类型。遗憾的是，目前只支持 Vue、React、Svelte 三个 MVVM 库类型，如果你涉及其他库就需要自己编写类型来实现了。

使用 VueHook 时：

```javascript
const vueAlova = createAlova({
	statesHook: VueHook
	// ...
});
const {
	loading, // Ref<boolean>
	data, // Ref<unknown>
	error // Ref<Error>
} = useRequest(vueAlova.Get('/todo/list'));
```

使用 ReactHook 时：

```javascript
const reactAlova = createAlova({
	statesHook: ReactHook
	// ...
});
const {
	loading, // boolean
	data, // unknown
	error // Error
} = useRequest(reactAlova.Get('/todo/list'));
```

使用 SvelteHook 时：

```javascript
const svelteAlova = createAlova({
	statesHook: SvelteHook
	// ...
});
const {
	loading, // Readable<boolean>
	data, // Readable<unknown>
	error // Readable<Error>
} = useRequest(svelteAlova.Get('/todo/list'));
```

你可能会发现，data 的类型是`unknown`，因为 data 需要根据不同接口单独设置类型，接下来我们看下。

#### 响应数据的类型

当你为一个数据接口指定类型时，需要分为两种情况。

情况 1：响应数据不需要再调用`transformData`转换

```typescript
interface Todo {
	title: string;
	time: string;
	done: boolean;
}
const Get = alova.Get<Todo[]>('/todo/list');
```

情况 2：响应数据需要再调用`transformData`转换

```typescript
interface Todo {
	title: string;
	time: string;
	done: boolean;
}
const Get = alova.Get('/todo/list', {
	// 将类型写到data参数中，而headers会自动推断，可以不用指定类型
	transformData(data: Todo[], headers) {
		return data.map(item => ({
			...item,
			status: item.done ? '已完成' : '未完成'
		}));
	}
});
```

这样 data 数据就会带有特定的类型了，需要注意的是，响应数据是经过全局响应拦截器转换后的，因此设置类型时也应该设置为转换后的类型。

#### 根据请求适配器推断的类型

因为`alova`支持自定义请求适配器，而不同的适配器的请求配置对象、响应对象、响应头都可能不同，因此全局的`beforeRequest`、`responsed`拦截器，以及`Method`对象创建时的配置对象的类型，都会根据请求适配器提供的类型自动推断，我们先来看这几个类型。

```typescript
// 通用的Method对象的通用配置类型
type CommonMethodConfig = {
	readonly url: string;
	readonly method: MethodType;
	data?: Record<string, any> | FormData | string;
};

// `Method`对象创建时的配置对象的类型
type AlovaMethodConfig<R, T, RC, RH> = {
	// 以下为创建Method对象时指定的配置对象
	name?: string;

	// url中的参数，一个对象
	params?: Record<string, any>;

	// 请求头，一个对象
	headers?: Record<string, any>;

	// 静默请求，onSuccess将会立即触发，如果请求失败则会保存到缓存中后续继续轮询请求
	silent?: boolean;

	// 当前中断时间
	timeout?: number;

	// 响应数据在缓存时间内则不再次请求。get、head请求默认保鲜5分钟（300000毫秒），其他请求默认不缓存
	localCache?:
		| numbe
		| {
				expire: number;
				mode?: number;
				tag?: string | number;
		  };

	// 是否启用下载进度信息，启用后每次请求progress才会有进度值，否则一致为0，默认不开启
	enableDownload?: boolean;

	// 是否启用上传进度信息，启用后每次请求progress才会有进度值，否则一致为0，默认不开启
	enableUpload?: boolean;

	// 响应数据转换，转换后的数据将转换为data状态，没有转换数据则直接用响应数据作为data状态
	transformData?: (data: T, headers: RH) => R;
} & RC;
```

这边涉及到的`RC`、`RH`，以及这边未出现的`RE`都是通过请求适配器推断的，它们分别表示请求配置对象类型、响应头对象类型、响应类型，如果你使用`GlobalFetch`时，他们的类型分别会被推断为：

1. `RC`为 fetch api 的请求配置对象`RequestInit`;
2. `RH`为响应头对象`Headers`;
3. `RE`为响应对象`Response`;

知道了这些后我们继续看下面的类型定义。

#### 全局请求前拦截器参数类型

全局请求前拦截器`beforeRequest`接收一个汇总的请求配置，它的类型为：

```typescript
type AlovaRequestAdapterConfig<R, T, RC, RH> = CommonMethodConfig &
	AlovaMethodConfig<R, T, RC, RH> & {
		// 会保证headers、params参数是一个对象
		headers: Record<string, any>;
		params: Record<string, any>;
	};
```

#### 全局响应拦截器参数类型

全局响应拦截器`responsed`接收一个响应对象，它的类型为响应对象`RE`。

```typescript
type ResponsedHandler<RE> = (response: RE) => any;
```

当请求适配器使用`GlobalFetch`时，`RE`将自动推断为`Response`类型。

#### Method 配置对象的类型

Method 配置对象的类型为上面提高的 [AlovaMethodConfig](#根据请求适配器推断的类型)，它包含通用的配置参数和根据请求适配器推断出的`RC`的并集。当请求适配器使用`GlobalFetch`时，`RC`将自动推断为`RequestInit`类型。

#### 请求适配器类型

```typescript
interface Progress {
	total: number; // 总量
	loaded: number; // 已加载量
}

type AlovaRequestAdapter<R, T, RC, RE, RH> = (adapterConfig: AlovaRequestAdapterConfig<R, T, RC, RH>) => {
	response: () => Promise<RE>;
	headers: () => Promise<RH>;
	onDownload?: (handler: (total: number, loaded: number) => void) => void;
	onUpload?: (handler: (total: number, loaded: number) => void) => void;
	abort: () => void;
};
```

需要注意的是，如果需要在`alova`中自动推断`RC`、`RE`、`RH`类型，那么自定义请求适配器上不应该指定任何泛型，且需要手动指定`RC`、`RE`、`RH`的类型，否则会导致类型推断错误。

以`GlobalFetch`为例。[GlobalFetch 源码点此查看](https://github.com/JOU-amjs/alova/blob/main/src/predefine/GlobalFetch.ts)

```typescript
type GlobalFetch = (defaultRequestInit?: RequestInit) => (
	adapterConfig: AlovaRequestAdapterConfig<unknown, unknown, RequestInit, Headers>
) => {
	response: () => Promise<Response>;
	headers: () => Promise<Headers>;
	onDownload: (handler: (total: number, loaded: number) => void) => void;
	abort: () => void;
};
```

#### 自定义 statesHook 的类型

敬请期待

## 实践示例

敬请期待
