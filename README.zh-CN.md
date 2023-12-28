<p align="center">
  <img width="200px" src="https://alova.js.org/img/logo-text-vertical.svg" />
</p>

<p align="center"><b>轻量级的请求策略库，它针对不同请求场景分别提供了具有针对性的请求策略，来提升应用可用性、流畅性，降低服务端压力，让应用如智者一般具备卓越的策略思维</b></p>

<p align="center">中文 | <a href="./README.md">📑English</a></p>

[![npm](https://img.shields.io/npm/v/alova)](https://www.npmjs.com/package/alova)
[![build](https://github.com/alovajs/alova/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/alovajs/alova/actions/workflows/release.yml)
[![coverage status](https://coveralls.io/repos/github/alovajs/alova/badge.svg?branch=main)](https://coveralls.io/github/alovajs/alova?branch=main)
[![stars](https://img.shields.io/github/stars/alovajs/alova?style=social)](https://github.com/alovajs/alova)
[![minzipped size](https://badgen.net/bundlephobia/minzip/alova)](https://bundlephobia.com/package/alova)
[![discord](https://img.shields.io/badge/chat-Discord-515ff1)](https://discord.gg/S47QGJgkVb)
[![wechat](https://img.shields.io/badge/chat_with_CH-Wechat-07c160)](https://alova.js.org/img/wechat_qrcode.jpg)
[![dependency](https://badgen.net/bundlephobia/dependency-count/alova)](https://bundlephobia.com/package/alova)
[![tree shaking](https://badgen.net/bundlephobia/tree-shaking/alova)](https://bundlephobia.com/package/alova)
![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

## alova 是什么

alova 是一个轻量级的请求策略库，支持开发者使用声明式实现例如请求共享、分页请求、表单提交、断点续传等各种较复杂的请求，让开发者使用非常少量的代码就可以实现高可用性和高流畅性的请求功能，这意味着，你再也不需要自己绞尽脑汁编写请求优化代码，再也不需要自己维护请求数据和相关状态，你只需要选择并使用请求模块，设置参数后，alova 帮你搞定。从而提升开发效率、应用运行效率，还能降低服务端压力。

请访问[alova 网站](https://alova.js.org)了解更多信息，或[查尝试运行的示例](https://alova.js.org/category/examples)。

## 选择 alova 的理由

alova 也致力于解决客户端网络请求的问题，但与其他请求库不同的是，alova 选择了业务场景化请求策略的方向，它配合`axios/fetch api`等请求库后能满足你绝大部分请求需求（99%）的同时，还提供了丰富的高级功能。

- 你可能曾经也在思考着应该封装`fetch`和`axios`，现在你不再需要这么做了，通过 alova 使用声明的方式完成请求，例如请求共享、分页请求、表单提交、断点上传等各种较复杂的请求，以及自动化缓存管理、请求共享、跨组件更新状态等。
- alova 是轻量级的，只有 4kb+，是 axios 的 30%+。
- 目前支持`vue/react/react-native/svelte`，以及`next/nuxt/sveltekit`等 SSR 框架，同时也支持`Uniapp/Taro`多端统一框架。
- alova 是低耦合的，你可以通过不同的适配器让 alova 在任何 js 环境下，与任何 UI 框架协作使用（内置支持的 UI 框架为`vue/react/svelte`），并且提供了统一的使用体验和完美的代码迁移。
- 使用 alova 还能实现 api 代码的高聚合组织方式，每个 api 的请求参数、缓存行为、响应数据转换等都将聚集在相同的代码块中，这对于管理大量的 api 有很大的优势。

## 加入交流社区

- [加入在 Discord 社区参与交流](https://discord.gg/S47QGJgkVb)
- [加入微信群参与交流](https://alova.js.org/img/wechat_qrcode.jpg)

## 打破 useHook 使用边界

现在，alova 已经完美兼容了[vue options，尽情使用吧！](/tutorial/framework/vue-options)

## 安装

```bash
# 使用 npm
npm install alova --save

# 使用 yarn
yarn add alova
```

## 我们需要你的支持

如果你喜欢 alova，我们非常感谢您在右上角给我们 star，这是对我们工作的认可和鼓励。

## 欢迎参与贡献

我们在 Issues 和 Disscussion 中收到了来自世界各地的开发者积极参与的信息，深感荣幸。

我们期望将 alova 打造成每位愿意参与的人的共同项目，而不是 alova 团队的，我们以开放包容的态度鼓励每个人成为 alova 社区的贡献者，即使你是一位初级开发者，只要想法符合 alova 的发展准则，也请大方地参与进来。

alova 还属于新秀，它依然还有很长一段路需要走，现在参与贡献可以为你赢得更多的有效贡献机会，它可以让你为全世界的开发者提供你的价值。

我们认为贡献 alova 不局限于代码贡献，而是参与任何有利于 alova 发展的活动都属于贡献 alova，具体包括以下 13 项，但不局限于这些：

1. 在项目中使用 alova
2. 为 alova 点星
3. 报告 bug
4. 提供新特性想法
5. 贡献代码
6. 基于 alova 编写适配器和策略库
7. 参与社区交流、PR review
8. 编写 demo
9. 更正或编写文档
10. 翻译文档
11. 在社交平台发布有利于 alova 发展的文章、视频等信息
12. 项目合作
13. 项目捐赠

> 以及你能想到的其他正向发展的活动

有效的贡献将为你赢得一定的 alova 社区名望。在参与贡献前，请务必详细阅读 [贡献指南](./CONTRIBUTING.zh-CN.md)，以保证你的有效贡献。

## Changelog

[前往 GitHub 上查看 alovajs 的所有 Changelog](https://github.com/alovajs/alova/releases)

## LICENSE

[MIT](https://en.wikipedia.org/wiki/MIT_License)
