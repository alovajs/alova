<img width="100%" src="https://alova.js.org/img/cover.jpg" />

<p align="center">
  The request strategy layer for JavaScript. Stop hand-writing pagination, form, upload and retry boilerplate — alova ships them as ready-made strategies, cutting your request code by up to 70%.
</p>

<p align="center">English | <a href="./README.zh-CN.md">中文</a> | <a href="./README.ja-JP.md">日本語</a></p>

<p align="center">
  <a href="https://alova.js.org">Documentation</a> | 
  <a href="https://alova.js.org/examples">Demos</a>
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

## What is alova?

alova (pronounced /əˈləʊva/) is the **request strategy layer for JavaScript**. You've hand-written pagination, forms, uploads and retries countless times — now just pick one of 20+ ready-made request strategies and cut your request code by up to **70%**.

You don't have to throw away the axios or fetch you already know. alova sits right on top of your existing request library and takes over the logic you keep rewriting. One API set spans React, Vue, Svelte, Solid, mini-programs and the server — learn once, use everywhere, so you can focus on business logic on both the client and the server.

## Features

Instead of listing what alova "is", here's what it solves for you:

| The boilerplate you're tired of | What alova gives you | The payoff |
| :--- | :--- | :--- |
| Hand-writing pagination, forms, uploads, SSE states | `usePagination` / `useForm` / `useUploader` / `useSSE` | Up to 70% less boilerplate |
| Server-side rate limiting & retries (incl. distributed) | `alova/server` | Capabilities React Query / SWR simply don't cover |
| Rebuilding the same logic for every framework | One API set | Spans React / Vue / Svelte / Solid / mini-programs |
| Manually maintaining cache invalidation | Multi-level cache (L1/L2) + declarative invalidation via `hitSource` | Cache invalidation is no longer painful |
| Copy-pasting API info between docs and your editor | `worma` | API hints & docs show up right inside your editor |

And of course:

- Easy to use, [watch the video](https://alova.js.org/video-tutorial) to get started in 5 mins.
- Full compatibility with your favorite HTTP clients and UI frameworks.
- 20+ high-performance request strategies (business modules) for building faster apps.
- Request sharing and response cache to improve app performance.
- End-to-end type safety.
- Advanced OpenAPI solution `worma`: from one OpenAPI spec, generate type-safe calling code, TypeScript types, full API docs, and API knowledge for your AI coding assistant.

## When should you use alova?

alova is honest about where it shines — and where a simpler tool is enough:

| Your situation | Recommendation |
| :--- | :--- |
| Simple CRUD + caching | React Query / SWR are enough |
| Complex admin / forms / pagination / uploads | ✅ alova is clearly a step ahead |
| Cross-platform (Web + mini-program / uni-app / Taro) | ✅ One API set covers everything |
| Server-side request governance (rate limit / retry / distributed) | ✅ alova is almost the only choice |
| OpenAPI → type-safe code + AI-friendly API knowledge | ✅ Pair with `worma` (works out of the box with alova) |

## Is there any difference?

Unlike libraries such as `@tanstack/react-query`, `swrjs`, and `ahooks`'s `useRequest`, alova aims to make API integration very easy and efficient, while maintaining more efficient data interaction and bringing a smoother experience to users.

> You can also check [Comparison with other request libraries](https://alova.js.org/about/comparison) to learn more about the differences of alova.

## Join the community

- [Follow us on X](https://x.com/alovajs)
- [Join the Discord](https://discord.gg/S47QGJgkVb)
- [Join the WeChat group](https://alova.js.org/img/wechat_qrcode.jpg)

## We need your support

If you like alova, we are very grateful for giving us a star in the upper right corner, which is a recognition and encouragement for our work.

## Welcome to contribute

We are honored to receive active participation from developers around the world in Issues and Discussions.

We hope to make alova a common project for everyone who is willing to participate. We encourage everyone to become a contributor to the alova community with an open and inclusive attitude. Even if you are a junior developer, as long as your ideas meet the development guidelines of alova, please participate generously.

Effective contributions will win you a certain reputation in the Alova community. Before contributing, please be sure to read the [Contribution Guide](./CONTRIBUTING.md) in detail to ensure your contribution is effective.

## Changelog

[Link](https://github.com/alovajs/alova/releases)

## Contributors

<a href="https://github.com/alovajs/alova/graphs/contributors">
<img src="https://contrib.rocks/image?repo=alovajs/alova&max=30&columns=10" />
</a>

## LICENSE

[MIT](https://en.wikipedia.org/wiki/MIT_License)
