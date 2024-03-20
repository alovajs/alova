<p align="center">
  <img width="200px" src="https://alova.js.org/img/logo-text-vertical.svg" />
</p>

<p align="center"><b>一行代码完成各种复杂场景的网络请求，别再花时间在请求这件小事上了，交给我们</b></p>

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

alova 是一个轻量级的请求策略库，它提供了一套完整的应对复杂请求场景的方案，我们称之为**请求策略**，只需一行代码就能快速实现各种复杂的请求逻辑，不仅能帮你提升开发效率，还能帮你提升 App 的运行效率，降低服务端压力。

## 有什么不同吗？

与其他请求库不同的是，alova 的目标是让请求变得更简单并保持更高效的数据交互。

我们为开发者和 App 使用者双方考虑，对于开发者来说，alova 为他们提供了简单的请求 api，和开箱即用的高性能请求策略模块，对于应用的用户来说，他们可以享受到 alova 的高性能数据交互带来的流畅体验。

此外，再从具体的特性来看看：

- 与 axios 相似的 api 设计，让使用者学习成本更低；
- 10+个开箱即用的高性能请求策略，让应用更流畅；
- alova 是轻量级的，只有 4kb+，是 axios 的 30%+；
- 灵活性高，alova 的适配器可以让 alova 在任何 js 环境下，与任何 UI 框架协作使用（内置支持的 UI 框架为`vue/react/svelte`），并且提供了统一的使用体验和完美的代码迁移；
- 3 种缓存模式和请求共享机制，提升请求性能并降低服务端压力；
- api 代码的高聚合组织，每个 api 的请求参数、缓存行为、响应数据转换等都将聚集在相同的代码块中，这对于管理大量的 api 有很大的优势；

在[alova 的未来](https://alova.js.org/tutorial/others/future)中，将实现更进一步的请求简单化。

> 你还可以查看请[与其他请求库比较](https://alova.js.org/tutorial/others/comparison)详细了解 alova 的不同之处。

## 文档

访问[alova 网站](https://alova.js.org)了解更多信息，或[查尝试运行的示例](https://alova.js.org/category/examples)。

## 加入交流社区

- [在 X 上关注我们，持续获得最新动态](https://x.com/alovajs)
- [加入在 Discord 社区参与交流](https://discord.gg/S47QGJgkVb)
- [加入微信群参与交流](https://alova.js.org/img/wechat_qrcode.jpg)

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

[前往查看](https://github.com/alovajs/alova/releases)

## Contributors

<a href="https://github.com/alovajs/alova/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=alovajs/alova&max=30&columns=10" />
</a>

## LICENSE

[MIT](https://en.wikipedia.org/wiki/MIT_License)
