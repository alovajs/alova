<img width="100%" src="https://alova.js.org/img/cover.jpg" />

<p align="center">
  <strong>请求的单元，不是一次调用，是一个场景。</strong><br/>
  <em>alova 是一个全栈请求策略库，它把请求逻辑组织成开箱即用的请求策略。</em>
</p>

<p align="center"><a href="./README.md">📑English</a> | 中文 | <a href="./README.ja-JP.md">日本語</a></p>
<p align="center">
  <a href="https://alova.js.org">文档</a> | 
  <a href="https://alova.js.org/examples">示例</a>
</p>

[![npm](https://img.shields.io/npm/v/alova)](https://www.npmjs.com/package/alova)
[![build](https://github.com/alovajs/alova/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/alovajs/alova/actions/workflows/release.yml)
[![coverage status](https://coveralls.io/repos/github/alovajs/alova/badge.svg?branch=main)](https://coveralls.io/github/alovajs/alova?branch=main)
[![stars](https://img.shields.io/github/stars/alovajs/alova?style=social)](https://github.com/alovajs/alova)
[![discord](https://img.shields.io/badge/chat-Discord-515ff1)](https://discord.gg/S47QGJgkVb)
[![wechat](https://img.shields.io/badge/chat_with_CH-Wechat-07c160)](https://alova.js.org/img/wechat_qrcode.jpg)
[![tree shaking](https://badgen.net/bundlephobia/tree-shaking/alova)](https://bundlephobia.com/package/alova)
![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)
![strategies](https://img.shields.io/badge/strategies-20%2B-blue)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

## 赞助商

感谢以下慷慨的赞助商对 alova 开发的支持。

<p align="center">
  <a href="https://watchthis.dev" target="_blank" rel="noopener noreferrer">
    <img src="https://alova.js.org/img/sponsors/watchthis-dev-500.png" alt="watchthis.dev" height="80" />
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://worma.js.org" target="_blank" rel="noopener noreferrer">
    <img src="https://worma.js.org/img/logo.svg" alt="worma" height="80" />
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://sealedrose.com/verify-video" title="Sealed Rose — AI Deepfake Detector" target="_blank" rel="noopener noreferrer">
    <img src="https://alova.js.org/img/sponsors/mark-pure-white-wax.png" alt="Sealed Rose — AI Deepfake Detector" height="80" />
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://jamfeed.com/tools/instagram-account-analyzer-for-musicians/" title="JamFeed — Instagram Account Analyzer for Musicians" target="_blank" rel="noopener noreferrer">
    <img src="https://alova.js.org/img/sponsors/jamfeed.png" alt="JamFeed — Instagram Account Analyzer for Musicians" height="80" />
  </a>
</p>

## 什么是 alova

alova（读作 /əˈləʊva/）是一个**全栈请求策略库**。它把请求看作一个有生命周期的场景，而不是一次瞬时的调用，并把分页、表单、上传、权限管理等客户端请求逻辑，以及重试、验证服务、BFF 等服务端逻辑，组织成开箱即用的**请求策略**。

你不必扔掉已经用惯的 axios 或 fetch。alova 直接架在你现有的请求库之上，接管那些你每次都要重写一遍的请求逻辑。同一套 API 横跨 React、Vue、Svelte、Solid、小程序与服务端，一次学会，处处都能用。

想了解背景故事，可以读 [为什么创造 alova](https://alova.js.org/about/faqs)；想了解差异，可以看 [与其他请求库对比](https://alova.js.org/about/comparison)。

## 为什么要使用alova

### 一、交付的是完整的场景，不是能跑的请求

AI Coding 时代，拉开差距的是应用的用户体验。不是 AI 能力不够，而是你的提示词里大概率不会出现下面这些请求功能的说明——因为从来没人给过你一张清单，告诉你应该如何管理请求：

- **输入防抖**：不写，快速输入就连发请求
- **相同条件命中缓存**：不写，同一个接口反复打
- **过期响应丢弃**：不写，旧响应可能覆盖新结果
- **失败自动重试**：不写，一失败页面就白屏
- **下一页预取**：不写，用户每次翻页都盯着 loading
- ...

这张清单就是 [RSM（请求场景模型）](https://alova.js.org/tutorial/getting-started/rsm)，alova 把它落到了场景 hooks 的配置项里。

### 二、无需审核 AI 写的代码

请求层代码在一个页面里占很大一部分，AI 写的代码总需要再 review 一遍。使用 alova 后，请求层从「需要审的实现」变成「只需要核的配置」——省下时间，也提升了稳定性。

## 特性

- 简单易用，[观看视频](https://alova.js.org/video-tutorial) 5 分钟上手。
- 客户端请求策略：`usePagination` / `useForm` / `useUploader` / `useSSE` / `useWatcher` / `useFetcher` / `useCaptcha` / `useSQRequest` 等，见 [请求策略列表](https://alova.js.org/tutorial/client/strategy)。
- 服务端请求策略：`atomize` / `retry` / `createRateLimiter` 等，见 [server hooks](https://alova.js.org/tutorial/server/strategy)。
- 一套 API 横跨 React、Vue、Svelte、Solid、小程序与 Node.js / Deno / Bun，完美兼容你最喜欢的 HTTP client 和 UI 框架。
- 请求共享与多级缓存，端到端类型安全，提升应用性能。
- 先进的 OpenAPI 解决方案 `worma`：一份 OpenAPI 规范，产出类型安全调用代码、TypeScript 类型、接口文档以及供 AI 编码助手读取的接口知识。
- 用 AI Agent 开发？安装 [Agent Skills](https://alova.js.org/tutorial/getting-started/agent-skills)，让 Agent 按官方最佳实践写 alova 代码。

## 有什么不同吗？

`@tanstack/react-query`、`swr` 把请求抽象为**数据同步**，单位是 query；alova 把请求抽象为**场景**，单位是 scenario。这是定义上的区别，不是功能多少的区别。

一段请求代码里，「执行」通常只有一行，交给 axios / fetch 就够了；真正花时间的是触发时机、这次要不要真的发、响应回来之后怎么用——这三段正是 alova 接管的。分页场景用 `usePagination` 一次声明，翻页、预取与增删改同步都在其中。

详见 [与其他请求库的对比](https://alova.js.org/about/comparison)。

## 加入交流社区

- [在 X 上关注我们，持续获得最新动态](https://x.com/alovajs)
- [加入在 Discord 社区参与交流](https://discord.gg/S47QGJgkVb)
- [加入微信群参与交流](https://alova.js.org/img/wechat_qrcode.jpg)

## 我们需要你的支持

如果你喜欢 alova，我们非常感谢您在右上角给我们 star，这是对我们工作的认可和鼓励。

## 欢迎参与贡献

我们在 Issues 和 Discussions 中收到了来自世界各地的开发者积极参与的信息，深感荣幸。

我们期望将 alova 打造成每位愿意参与的人的共同项目，我们以开放包容的态度鼓励每个人成为 alova 社区的贡献者，即使你是一位初级开发者，只要想法符合 alova 的发展准则，也请大方地参与进来。

有效的贡献将为你赢得一定的 alova 社区名望。在参与贡献前，请务必详细阅读 [贡献指南](./CONTRIBUTING.zh-CN.md)，以保证你的有效贡献。

## Changelog

[前往查看](https://github.com/alovajs/alova/releases)

## Contributors

<a href="https://github.com/alovajs/alova/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=alovajs/alova&max=30&columns=10" />
</a>

## LICENSE

[MIT](https://en.wikipedia.org/wiki/MIT_License)
