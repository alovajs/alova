<p align="center">
  <img width="200px" src="https://alova.js.org/img/logo-text-vertical.svg" />
</p>

<p align="center"><b>A lightweight request strategy library, which provides targeted request strategies for different request scenarios to improve application availability and fluency, reduce server pressure, and enable applications to have excellent strategic thinking like a wise man.</b></p>

<p align="center">English | <a href="./README.zh-CN.md">📑中文</a></p>

[![npm](https://img.shields.io/npm/v/alova)](https://www.npmjs.com/package/alova)
[![build](https://github.com/alovajs/alova/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/alovajs/alova/actions/workflows/release.yml)
[![coverage status](https://coveralls.io/repos/github/alovajs/alova/badge.svg?branch=main)](https://coveralls.io/github/alovajs/alova?branch=main)
[![stars](https://img.shields.io/github/stars/alovajs/alova?style=social)](https://github.com/alovajs/alova)
[![minzipped size](https://badgen.net/bundlephobia/minzip/alova)](https://bundlephobia.com/package/alova)
[![discord](https://img.shields.io/badge/chat-Discord-515ff1)](https://discord.gg/S47QGJgkVb)
[![qq](https://img.shields.io/badge/chat_with_CH-QQ-0094f7)](https://pd.qq.com/s/1cdjx0nnw)
[![dependency](https://badgen.net/bundlephobia/dependency-count/alova)](https://bundlephobia.com/package/alova)
[![tree shaking](https://badgen.net/bundlephobia/tree-shaking/alova)](https://bundlephobia.com/package/alova)
![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

## What is alova

alova is a lightweight request strategy library. It supports developers to use declarative way for various complex requests such as request sharing, paging requests, form submission, breakpoint resumption, etc., allowing developers to use little code to complete high availability and high fluency network interaction. This means that you no longer need to write the codes about request logic, and no longer need to maintain relevant data and states yourself. You only need to select and use the request useHook, alova will take over it for you. This will improve development efficiency, application operation efficiency, and reduces server pressure.

Learn more at the [alovajs website](https://alova.js.org), or try it out in [runnable examples](https://alova.js.org/category/examples).

## Reasons for choosing alova

Alova is also committed to solving the problem of client network requests, but unlike other request libraries, alova chooses the direction of business scenario request strategy, and it also provides rich Advanced Features.

- You may have been thinking about how to wrap `fetch` and `axios`. Now you no longer need to do this. alova complete complex requests with declarative style, such as request sharing, paging requests, form submissions, breakpoint uploads, etc, as well as automated cache management, request sharing, cross-component status update, etc.
- alova is lightweight, only 4kb+, which is 30%+ of axios.
- alova is low-coupling, you can make alova work with any UI framework in any js environment through different adapters (built-in supported UI framework is `vue/react/svelte`), and provides a unified experience and perfect code migration.
- alova can also achieve a highly aggregated organization of APIs. The request parameters, cache behavior, and response data transform of each API will be in the same code block, which has great advantages for managing a large number of APIs.

## Join the channel community

- [Join Discord community](https://discord.gg/S47QGJgkVb)
- [Join Wechat group](https://alova.js.org/img/wechat_group.jpg)

## Breaking the useage's boundary of useHook

NOW, alova has perfect compatibility with [vue options, let's enjoy it!](https://alova.js.org/tutorial/framework/vue-options)

## Install

```bash
# use npm
npm install alova --save

# use yarn
yarn add alova
```

## We need your support

If you like alova. we are very appreciate your star at the topright. it's a approval and encourage of our work.

## Welcome to contribute

We're honored to hear from developers around the world in Issues and Discussions.

We expect to make alova a common project for everyone who is willing to participate, instead of the alova team. We encourage everyone to become a contributor to the alova community with an open and inclusive attitude. Even if you are a junior developer, as long as your idea is in line with alova's goal, please generously participate.

Now alova is still a rookie, and it still has a long way to go. Participating in contributions now can let you win more effective contribution opportunities, and it will let developers all over the world to use your code.

We believe that contributing to alova is not only limited to code contributions, but also participating in any activities that are conducive to the development of alova is considered to contribute to alova, including the following 13 items, but not limited to these:

1. Use alova in your project.
2. Star alova in Github.
3. Report bugs.
4. Provide new feature ideas.
5. Contribute code.
6. Code adapter and stritegy library based on alova.
7. Participate in community communication and PR review.
8. Code a demo.
9. Correct documentation or add new content.
10. Translate documents.
11. Publish articles, videos and other information that are conducive to the development of alova on social platforms.
12. Project cooperation.
13. Project donation.

> and any other positive development you can think of

Contributing effectively will let you win some fame of alova community. Before participating in the contribution, please be sure to read the [CONTRIBUTING](./CONTRIBUTING.md) in detail to ensure your effective contribution.

## Changelog

[View all Changelog of alovajs on GitHub](https://github.com/alovajs/alova/releases)

## LICENSE

[MIT](https://en.wikipedia.org/wiki/MIT_License)
