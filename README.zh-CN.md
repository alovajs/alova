<p align="center">
  <img width="200px" src="https://alova.js.org/img/logo-text-vertical.png" />
</p>

<p align="center"><b>轻量级的请求策略库，它针对不同请求场景分别提供了具有针对性的请求策略，来提升应用可用性、流畅性，降低服务端压力，让应用如智者一般具备卓越的策略思维。</b></p>

<p align="center">中文 | <a href="./README.md">📑English</a></p>

[![npm](https://img.shields.io/npm/v/alova)](https://www.npmjs.com/package/alova)
[![build](https://github.com/alovajs/alova/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/alovajs/alova/actions/workflows/release.yml)
[![coverage status](https://coveralls.io/repos/github/alovajs/alova/badge.svg?branch=main)](https://coveralls.io/github/alovajs/alova?branch=main)
[![minzipped size](https://badgen.net/bundlephobia/minzip/alova)](https://bundlephobia.com/package/alova)
[![dependency](https://badgen.net/bundlephobia/dependency-count/alova)](https://bundlephobia.com/package/alova)
[![tree shaking](https://badgen.net/bundlephobia/tree-shaking/alova)](https://bundlephobia.com/package/alova)
![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

## 🔥 文档

[https://alova.js.org](https://alova.js.org)

## 🚀 特点

- 🎪 交互式文档和演示
- 🕶 支持 vue、react、svelte
- 🦾 实时自动状态管理
- 📑 类似 axios 的 api 设计，更简单
- 🐦 4kb，只有 axios 的 30%+
- 👄 声明式场景请求
- 🔩 灵活：使用任何请求库，如 axios、superagent 或 fetch-api
- 🔋 3 种响应数据缓存模式
- ✨ 界面数据在任何情况下都是预取的，这意味着用户可以更快地看到信息
- 🖥️ 服务端渲染（SSR）
- 🎈 Typescript 支持
- 📴 静默/离线提交
- ⚡ 完全支持 Tree shaking：只拿你想要的，捆绑大小
- 🔌 丰富的扩展功能，可以自定义请求适配器、存储适配器、请求中间件、状态钩子等

## 例子

[这里的例子将展示 alova 的力量](https://alova.js.org/category/examples)

## 和请求库的关系是什么？

alova 的创建初衷是对不同请求场景提出的一个解决方案，它可以更简洁优雅地实现体验更好，性能更好的请求功能，是一个 RSM 实现库，而例如$.ajax、axios 和 fetch-api 等对请求发送和响应接收提供了很好的支持，它们是 RSM 流程中必不可少的一个环节（请求事件环节），alova 仍然需要依靠它们进行请求，因此我们可以将 alova 看作是请求库的一种武装，让请求库变得更加强大。

## 库稳定性

alova 从第一个版本的开发到现在已经过去将近一年时间了，在这一年中我们也在持续发现问题优化，到目前为止 alova 已通过了 145 项单元测试，覆盖率为 99%。即便如此，alova 还属于新秀，因此我也建议你可以先保守使用。

**我保证会在收到 issue 后，第一时间解决**

## 我们真的需要你的 star

如果你喜欢 alova，我们非常感谢您在右上角给我们 star，这是对我们工作的认可。

## 与其他库的大小比较

| alova                                                                                             | axios                                                                                             | react-query                                                                                                   | vue-request                                                                                                   | vue                                                                                           | react                                                                                                     |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [![minzip](https://badgen.net/bundlephobia/minzip/alova)](https://bundlephobia.com/package/alova) | [![minzip](https://badgen.net/bundlephobia/minzip/axios)](https://bundlephobia.com/package/axios) | [![minzip](https://badgen.net/bundlephobia/minzip/react-query)](https://bundlephobia.com/package/react-query) | [![minzip](https://badgen.net/bundlephobia/minzip/vue-request)](https://bundlephobia.com/package/vue-request) | [![minzip](https://badgen.net/bundlephobia/minzip/vue)](https://bundlephobia.com/package/vue) | [![minzip](https://badgen.net/bundlephobia/minzip/react-dom)](https://bundlephobia.com/package/react-dom) |

## 什么是请求场景模型

请求场景模型是以客户端视角的，描述客户端从触发请求意图到接收请求结果的抽象模型，分别由请求时机、请求行为、请求事件以及响应管理四个阶段组成。例如在进行一次请求时经常需要思考以下问题，

1. 什么时候发出请求；
2. 是否要展示请求状态；
3. 是否需要对请求进行失败重试；
4. 要如何加工响应数据；
5. 是否需要对请求参数加密；
6. 是否要对高频使用的响应数据做缓存；
7. 如何进行跨页面操作数据；
8. 弱网或断网环境下需要如何处理请求；
9. ...

`fetch`或`axios`往往更专注于如何与服务端交互，但对于上面的问题我们总是需要自己处理，这些有利于应用性能和稳定性的功能，总会让程序员们编写出低维护性的代码。请求场景模型就是从准备请求到响应数据加工完毕的所有环节进行抽象，从而覆盖以前端为视角的，整个 CS 交互生命周期的模型。`alova`就是一个以请求场景模型的库，它是对`axios`等请求库的一种补充，而非替代品。

> CS 交互：泛指所有客户端类型和服务端的数据交互

## 请求场景模型

![RSM](https://alova.js.org/img/rsm-cn.png)

## 请求时机

描述在什么时候需要发出请求，在`alova`中以`useHook`实现。

- 初始化展示数据，如刚进入某个界面或子界面；
- 人机交互触发 CS 交互，需要变更数据重新发出请求，如翻页、筛选、排序、模糊搜索等；
- 以防抖方式发送请求，避免视图数据闪动，以及降低服务端压力
- 预加载数据，如分页内预先加载下一页内容、预测用户点击某个按钮后预先拉取数据；
- 操作服务端数据，需发出增删改查请求，如提交数据、删除数据等；
- 同步服务端状态，如数据变化较快的场景下轮询请求、操作了某个数据后重新拉取数据；

## 请求行为

描述以怎样的方式处理请求，在`alova`中以 Method 抽象实现。

- 占位请求，请求时展示 loading、骨架图、或者是上次使用的真实数据；
- 缓存高频响应，多次执行请求会使用保鲜数据；
- 多请求串行与并行；
- 重要接口的重试机制，降低网络不稳定造成的请求失败概率；
- 静默提交，当只关心提交数据时，提交请求后直接响应成功事件，后台保证请求成功；
- 离线提交，离线时将提交数据暂存到本地，网络连接后再提交；

## 请求事件

表示携带请求参数发送请求，获得响应，`alova`可以与`axios`、`fetch`、`XMLHttpRequest`等任意请求库或原生方案共同协作。

## 响应管理

`alova`将响应数据状态化并统一管理，以请求层面的方式刷新视图数据、操作缓存，避免了在组件层面的操作，更加优雅和统一。

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

## 请求场景征集

如果你已经想到了一些特定且典型的业务请求场景，可以在这边 [提交 issue](https://github.com/alovajs/scene/issues/new/choose) 告诉我们，我们会实现它提供给更多人使用。

## 官方生态

| 项目                                                               | 说明                              |
| ------------------------------------------------------------------ | --------------------------------- |
| [@alova/mock](https://github.com/alovajs/mock)                     | alova.js 的模拟请求适配器         |
| [@alova/scene-react](https://github.com/alovajs/scene)             | alova.js 的 react 请求策略库      |
| [@alova/scene-vue](https://github.com/alovajs/scene)               | alova.js 的 vue 请求策略库        |
| [@alova/scene-svelte](https://github.com/alovajs/scene)            | alova.js 的 svelte 请求策略库     |
| [@alova/adapter-uniapp](https://github.com/alovajs/adapter-uniapp) | alova.js 的 uniapp 适配器         |
| [@alova/adapter-taro](https://github.com/alovajs/adapter-taro)     | alova.js 的 taro 适配器           |
| [@alova/adapter-axios](https://github.com/alovajs/adapter-axios)   | alova.js 的 axios 适配器          |
| [@alova/adapter-xhr](https://github.com/alovajs/adapter-xhr)       | alova.js 的 XMLHttpRequest 适配器 |

## 接下来要做什么

### 关于 alova

- ✅ 存储时间可以设置一个 date 对象，表示某个时间点过期
- ✅ 可全局分别设置不同请求方法的默认缓存，当前默认为 GET 请求 500 秒内存缓存
- ✅ 额外的状态管理，可跨页面和模块获取并更新额外的状态
- 请求错误日志打印
- ✅ 完整的离线提交功能，当离线状态可提交，再次进入时可读取离线信息等
- ✅ 请求中间件设计，可手动控制发送请求、状态修改等
- ✅ 静默提交失败时的重试间隔时间、最大重试次数等
- ✅ 请求共享
- ✅ 服务端渲染支持
- 性能提升

### 扩展

- ✅ 各运行环境下的适配器（Uniapp、Taro）
- 通过 [**alova/scene**](https://github.com/alovajs/scene) 库开发不同请求场景下的扩展 hooks，提供开箱即用的高性能和高体验功能 [[参考 usePagination](https://alova.js.org/strategy/usePagination)]

## 贡献指南

在提出拉取请求之前，请务必阅读 [贡献指南](./CONTRIBUTING.zh-CN.md)。

## 欢迎提交问题

如果您在使用 alova 时遇到困难，无论是 bug，还是未满足的功能，都可以[提交问题](https://github.com/alovajs/alova/issues)。

## LICENSE

[MIT](https://en.wikipedia.org/wiki/MIT_License)
