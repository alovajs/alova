<img width="100%" src="https://alova.js.org/img/cover.jpg" />

<p align="center">
  alova 是 JavaScript 的请求策略层。停止手写分页、表单、上传和重试逻辑，alova 已经把它们做成开箱即用的策略，最多可减少 70% 的请求代码。
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
![license](https://img.shields.io/badge/license-MIT-blue.svg)

## 什么是 alova？

alova（读作 /əˈləʊva/）是 JavaScript 的**请求策略层（request strategy layer）**。分页、表单、上传、重试这些逻辑你已经手写过无数遍，现在只需直接使用 20+ 个开箱即用的请求策略，最多可减少 **70% 的请求代码**。

你不必扔掉已经用惯的 axios 或 fetch。alova 直接架在你现有的请求库之上，接管那些你每次都要重写一遍的请求逻辑。同一套 API 横跨 React、Vue、Svelte、Solid、小程序与服务端，一次学会，处处都能用，让你在客户端和服务端都能专心写业务逻辑。

## 特性

与其罗列 alova「是什么」，不如看它「替你解决什么」：

| 你已经写腻的场景 | alova 给你的 | 具体收益 |
| :--- | :--- | :--- |
| 反复手写分页、表单、上传、SSE 状态 | `usePagination` / `useForm` / `useUploader` / `useSSE` | 最多减少 70% 样板代码 |
| 服务端限流与重试（含分布式） | `alova/server` | React Query / SWR 完全不覆盖的能力 |
| 每个框架都要重写一遍相同逻辑 | 同一套 API | 横跨 React / Vue / Svelte / Solid / 小程序 |
| 手动维护缓存失效 | 多级缓存（L1/L2）+ 基于 `hitSource` 的声明式自动失效 | 缓存失效不再痛苦 |
| 在文档与编辑器之间复制粘贴 API 信息 | `worma` | 接口提示与文档直接出现在编辑器里 |

当然还有：

- 简单易用，[观看视频](https://alova.js.org/video-tutorial) 5 分钟上手。
- 完美兼容你最喜欢的 HTTP client 和 UI 框架。
- 20+ 高性能业务模块（请求策略），帮助你快速开发性能更好的应用。
- 请求共享与响应缓存，提升应用性能。
- 端到端类型安全。
- 先进的 OpenAPI 解决方案 `worma`：一份 OpenAPI 规范，一次性产出类型安全调用代码、TypeScript 类型、接口文档以及供 AI 编码助手读取的接口知识。

## 什么时候该用 alova？

alova 会坦诚地告诉你它在哪里出彩，以及在哪里更简单的工具就已足够：

| 你的场景 | 建议 |
| :--- | :--- |
| 简单 CRUD + 缓存 | React Query / SWR 就够了 |
| 复杂中后台 / 表单 / 分页 / 上传 | ✅ alova 明显领先一档 |
| 跨端（Web + 小程序 / uni-app / Taro） | ✅ 同一套 API 全通吃 |
| 服务端请求治理（限流 / 重试 / 分布式） | ✅ alova 几乎是唯一选择 |
| OpenAPI → 类型安全代码 + AI 友好的接口知识 | ✅ 搭配 worma（对 alova 开箱即用） |

## 有什么不同吗？

与 `@tanstack/react-query`、`swrjs`、`ahooks` 的 `useRequest` 等库不同，alova 旨在让 API 集成变得非常轻松高效，还能保持更高效的数据交互，为用户带来更流畅的体验。

> 您还可以查看 [与其他请求库的比较](https://alova.js.org/about/comparison) 以详细了解 alova 的不同之处。

## 加入交流社区

- [在 X 上关注我们，持续获得最新动态](https://x.com/alovajs)
- [加入在 Discord 社区参与交流](https://discord.gg/S47QGJgkVb)
- [加入微信群参与交流](https://alova.js.org/img/wechat_qrcode.jpg)

## 我们需要你的支持

如果你喜欢 alova，我们非常感谢您在右上角给我们 star，这是对我们工作的认可和鼓励。

## 欢迎参与贡献

我们在 Issues 和 Disscussion 中收到了来自世界各地的开发者积极参与的信息，深感荣幸。

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
