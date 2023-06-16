<p align="center">
  <img width="200px" src="https://alova.js.org/img/logo-text-vertical.svg" />
</p>

<p align="center"><b>轻量级的请求策略库，它针对不同请求场景分别提供了具有针对性的请求策略，来提升应用可用性、流畅性，降低服务端压力，让应用如智者一般具备卓越的策略思维。</b></p>

<p align="center">中文 | <a href="./README.md">📑English</a></p>

[![npm](https://img.shields.io/npm/v/alova)](https://www.npmjs.com/package/alova)
[![build](https://github.com/alovajs/alova/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/alovajs/alova/actions/workflows/release.yml)
[![coverage status](https://coveralls.io/repos/github/alovajs/alova/badge.svg?branch=main)](https://coveralls.io/github/alovajs/alova?branch=main)
[![stars](https://img.shields.io/github/stars/alovajs/alova?style=social)](https://github.com/alovajs/alova)
[![minzipped size](https://badgen.net/bundlephobia/minzip/alova)](https://bundlephobia.com/package/alova)
[![dependency](https://badgen.net/bundlephobia/dependency-count/alova)](https://bundlephobia.com/package/alova)
[![tree shaking](https://badgen.net/bundlephobia/tree-shaking/alova)](https://bundlephobia.com/package/alova)
![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

## 🔥 文档

[https://alova.js.org](https://alova.js.org)

## 🚀 特点

- 🕶 在 vue、react、svelte 3 个 UI 框架，以及 uniapp、taro 环境下提供统一的使用体验，无缝移植
- 📑 与 axios 相似的 api 设计，更简单熟悉
- 🍵 开箱即用的高性能场景化请求策略，让应用更流畅
- 🐦 4kb+，只有 axios 的 30%+
- 🔩 高灵活性，兼容任意请求库，如 axios、superagent 或 fetch-api
- 🔋 3 种数据缓存模式，提升请求性能，同时降低服务端压力
- 🔌 丰富的扩展功能，可以自定义请求适配器、存储适配器、中间件，以及 states hook
- 🖥️ [2.2.0+]服务端渲染（SSR）
- 💕 请求共享，避免同时发送相同请求
- 🪑 数据预拉取，这意味着用户可以更快看到信息，无需等待
- 🦾 实时自动状态管理
- 🎪 交互式文档和示例
- 🎈 Typescript 支持
- ⚡ 支持 tree shaking，这意味着 alova 的生产体积往往小于 4kb

## alova 请求策略表

alova 是核心库，它提供了缓存策略、请求共享策略，以及状态管理等通用功能，能满足 95%以上的请求需求。同时，alova 还提供了业务逻辑的，高频使用的请求策略 hook，可以直接用于特定场景。以下为 alova 提供的请求策略 hook 列表。

| 名称                  | 描述                                                                                                                                               | 文档                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 分页请求策略          | 自动管理分页数据，数据预加载，减少不必要的数据刷新，流畅性提高 300%，编码难度降低 50%                                                              | [usePagination](https://alova.js.org/strategy/usePagination)                           |
| 无感数据交互策略      | 全新的交互体验，提交即响应，大幅降低网络波动造成的影响，让你的应用在网络不稳定，甚至断网状态下依然可用                                             | [useSQRequest](https://alova.js.org/strategy/sensorless-data-interaction/overview)     |
| 表单提交策略          | 为表单提交而设计的 hook，通过此 hook 你可以很方便地实现表单草稿、多页面（多步骤）表单，除此以外还提供了表单重置等常用功能                          | [useForm](https://alova.js.org/strategy/useForm)                                       |
| 发送验证码            | 验证码发送 hook，减掉你在开发验证码发送功能时的繁琐。                                                                                              | [useCaptcha](https://alova.js.org/strategy/useCaptcha)                                 |
| 跨组件触发请求        | 一个 alova 中间件，消除组件层级的限制，在任意组件中快速地触发任意请求的操作函数                                                                    | [actionDelegationMiddleware](https://alova.js.org/strategy/actionDelegationMiddleware) |
| 串行请求的 useRequest | 比[alova 的串行请求方式](https://alova.js.org/next-step/serial-request)更加简洁易用的串行请求 use hook，提供统一的 loading 状态、error、回调函数   | [useSerialRequest](https://alova.js.org/strategy/useSerialRequest)                     |
| 串行请求的 useWatcher | 比[alova 的串行请求方式](https://alova.js.org/next-step/serial-request)更加简洁易用的串行请求 use hook，提供统一的 loading 状态、error、回调函数。 | [useSerialWatcher](https://alova.js.org/strategy/useSerialWatcher)                     |
| 请求重试策略          | 请求失败自动重试，它在重要的请求和轮询请求上发挥重要作用                                                                                           | [useRetriableRequest](https://alova.js.org/strategy/useRetriableRequest)               |

### 更多请求相关的业务场景征集中...

如果你还有特定且典型的业务请求场景，但我们还未实现的，可以在这边 [提交 issue](https://github.com/alovajs/scene/issues/new/choose) 告诉我们，我们会实现它提供给更多人使用。同时也可以自定义请求 hook，请看 [高级](/category/advanced) 部分。

## 例子

[这里的例子将展示 alova 的力量](https://alova.js.org/category/examples)

## 库稳定性

alova 从第一个版本的开发到现在已经过去将近一年时间了，在这一年中我们也在持续发现问题优化，到目前为止 alova 已通过了 160+ 项单元测试，覆盖率为 99%。即便如此，alova 还属于新秀，因此我也建议你可以先保守使用。

**我保证会在收到 issue 后，第一时间解决**

## 我们真的需要你的 star

如果你喜欢 alova，我们非常感谢您在右上角给我们 star，这是对我们工作的认可。

## 替代请求库？

alova 是一个请求策略库，它的创建初衷是对不同请求场景提供特定的请求策略解决方案，从而更简洁优雅地实现流畅的请求体验，而例如`$.ajax`、`axios`和`fetch-api`等对请求发送和响应接收提供了很好的支持，它们是 [RSM](/get-started/RSM) 流程中必不可少的一个环节（请求事件），alova 仍然需要依靠它们进行请求，因此我们可以将 alova 看作是请求库的一种武装，让请求库变得更加强大。

## 为什么要深度绑定 UI 框架？

对一个 js 库来说解耦意味着更多场景下的使用，例如 axios 可以在 nodejs 中使用，但同时意味着开发者需要写更多的模板代码，比如使用 useHooks 封装 axios 等。而 alova 摒弃了解耦带来的更多使用场景，将使用范围定位在与 UI 框架配合使用，以最精简的方式使用 alova，这是为了开发者的收益方面而考量的，在一个 UI 框架盛行的时候，深度绑定可以为开发者提供直接使用的功能，提升开发者的使用体验，而不需要太多的模板代码。

## 与其他库的大小比较

| alova                                                                                             | axios                                                                                             | react-query                                                                                                   | vue-request                                                                                                   | vue                                                                                           | react                                                                                                     |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [![minzip](https://badgen.net/bundlephobia/minzip/alova)](https://bundlephobia.com/package/alova) | [![minzip](https://badgen.net/bundlephobia/minzip/axios)](https://bundlephobia.com/package/axios) | [![minzip](https://badgen.net/bundlephobia/minzip/react-query)](https://bundlephobia.com/package/react-query) | [![minzip](https://badgen.net/bundlephobia/minzip/vue-request)](https://bundlephobia.com/package/vue-request) | [![minzip](https://badgen.net/bundlephobia/minzip/vue)](https://bundlephobia.com/package/vue) | [![minzip](https://badgen.net/bundlephobia/minzip/react-dom)](https://bundlephobia.com/package/react-dom) |

## 什么是请求场景模型（RSM）

[点此查看请求场景模型详细介绍](https://alova.js.org/get-started/RSM)

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
