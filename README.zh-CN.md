# [alova](https://github.com/JOU-amjs/alova)

MVVM 库的请求场景管理库，是请求库的一个分支，不是替代品。它使您的应用程序更高效且易于开发。

[🔥文档](https://alova.js.org) | [📑English](./README.md)

[![npm](https://img.shields.io/npm/v/alova)](https://www.npmjs.com/package/alova)
[![build](https://github.com/alovajs/alova/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/alovajs/alova/actions/workflows/main.yml)
[![coverage status](https://coveralls.io/repos/github/alovajs/alova/badge.svg?branch=main)](https://coveralls.io/github/alovajs/alova?branch=main)
[![minzipped size](https://badgen.net/bundlephobia/minzip/alova)](https://bundlephobia.com/package/alova)
[![dependency](https://badgen.net/bundlephobia/dependency-count/alova)](https://bundlephobia.com/package/alova)
[![tree shaking](https://badgen.net/bundlephobia/tree-shaking/alova)](https://bundlephobia.com/package/alova)
![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

## 🚀 特点

- 🎪 交互式文档和演示
- 🕶 支持 vue、react、svelte
- 🦾 实时自动状态管理
- 📑 类似 axios 的 api 设计，更简单
- ▪️ 4kb，只有 axios 的 40%
- 👄 声明式场景请求
- 🔩 灵活：使用任何请求库，如 axios、superagent 或 fetch-api
- 🔋 3 种响应数据缓存模式
- ✨ 界面数据在任何情况下都是预取的，这意味着用户可以更快地看到信息
- 🎈 打字稿支持
- 🖥️ 离线提交
- ⚡ 完全可摇动的树：只拿你想要的，捆绑大小
- ⛑️ 更安全的乐观数据更新
- 🔌 丰富的扩展功能，可以自定义请求适配器、存储适配器、状态钩子

## 例子
[这里的例子将展示 alova 的力量](https://alova.js.org/category/%E7%A4%BA%E4%BE%8B)

## 我们真的需要你的star
如果你喜欢alova，我们非常感谢您在右上角给我们star，这是对我们工作的认可。

## 与其他库的大小比较
|alova |axios |react-query | vue-request | vue |react |
| ---- | ---- | ---- | ---- | ---- | ---- |
| [![minzip](https://badgen.net/bundlephobia/minzip/alova)](https://bundlephobia.com/package/alova) | [![minzip](https://badgen.net/bundlephobia/minzip/axios)](https://bundlephobia.com/package/axios) | [![minzip](https://badgen.net/bundlephobia/minzip/react-query)](https://bundlephobia.com/package/react-query) | [![minzip](https://badgen.net/bundlephobia/minzip/vue-request)](https://bundlephobia.com/package/vue-request) | [![minzip](https://badgen.net/bundlephobia/minzip/vue)](https://bundlephobia.com/package/vue) | [![minzip](https://badgen.net/bundlephobia/minzip/react-dom)](https://bundlephobia.com/package/react-dom) |

## 什么是请求场景管理

在提出请求时，我们总是要考虑以下问题，

1. 什么时候提出请求；
2. 是否显示请求状态；
3. 是否封装成request函数进行重复调用；
4. 如何处理响应数据；
5. 是否缓存经常使用的响应数据；
6. 如何跨页面操作数据；
7. 离线时还能提交数据吗？
8. ...

`fetch` 或 `axios` 往往更关注如何与服务器交互，但我们总是需要自己处理上述问题。这些有利于应用程序性能和稳定性的函数将始终允许程序员编写低维护的函数。性代码。请求场景管理就是抽象出从请求的准备到响应数据处理完成的所有环节，从而从前端的角度覆盖整个CS交互生命周期的模型。 `alova` 是一个基于请求场景模型的请求场景管理库。它是对 `axios` 等请求库的武装，而不是替代品。

> CS交互：指所有客户端类型与服务器端数据交互

## 请求场景模型

![model](https://user-images.githubusercontent.com/29848971/185773573-761b6153-9e6c-42df-b0b7-beddd405833c.png)

### 请求时机
描述在什么时候需要发出请求，在alova中以useHook实现。

- 初始化展示数据，如刚进入某个界面或子界面；
- 人机交互触发 CS 交互，需要变更数据重新发出请求，如翻页、筛选、排序、模糊搜索等；
- 预加载数据，如分页内预先加载下一页内容、预测用户点击某个按钮后预先拉取数据；
- 操作服务端数据，需发出增删改查请求，如提交数据、删除数据等；
- 同步服务端状态，如数据变化较快的场景下轮询请求、操作了某个数据后重新拉取数据；

### 请求行为

描述以怎样的方式处理请求，在alova中以 method 对象实现。

- 占位请求，请求时展示 loading、骨架图、或者是上次使用的真实数据；
- 缓存高频响应，多次执行请求会使用保鲜数据；
- 多请求串行与并行；
- 对频繁的请求进行防抖，避免前端数据闪动，以及降低服务端压力；
- 重要接口重试机制，降低网络不稳定造成的请求失败概率；
- 静默提交，当只关心提交数据时，提交请求后直接响应成功事件，后台保证请求成功；
- 离线提交，离线时将提交数据暂存到本地，网络连接后再提交；

### 请求事件
表示携带请求参数发送请求，获得响应，alova可以与axios、fetch、XMLHttpRequest等任意请求库或原生方案共同协作。

### 响应数据管理
alova将响应数据状态化，并统一管理，任何位置都可以对响应数据进行操作，并利用 MVVM 库的特性自动更新对应的视图。

- 移除缓存响应数据，再次发起请求时将从服务端拉取；
- 更新缓存响应数据，可更新任意位置响应数据，非常有利于跨页面更新数据；
- 刷新响应数据，可重新刷新任意位置的响应数据，也非常有利于跨页面更新数据；
- 自定义设置缓存，在请求批量数据时，可手动对批量数据一一设置缓存，从而满足后续单条数据的缓存命中；

## 安装

```bash
# 使用 npm
npm install alova --save

# 使用 yarn
yarn add alova
```

## 用法
[使用文档在这里](https://alova.js.org/getting-started/start)


## 官方生态系统
| 项目 | 说明 |
| ---- | ---- |
| [@alova/mock](https://github.com/alovajs/extensions/tree/main/packages/mock) | alova.js 的模拟请求适配器 |
| [@alova/hooks](https://github.com/alovajs/extensions/tree/main/packages/hooks) | alova.js 的扩展钩子|

## 贡献指南

在提出拉取请求之前，请务必阅读 [贡献指南](./CONTRIBUTING.zh-CN.md)。

## 欢迎提交问题
如果您在使用 alova 时遇到困难，无论是 bug，还是未满足的功能，都可以[提交问题](https://github.com/alovajs/alova/issues)。

## LICENSE

[MIT](https://en.wikipedia.org/wiki/MIT_License)