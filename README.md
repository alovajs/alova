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
[![dependency](https://badgen.net/bundlephobia/dependency-count/alova)](https://bundlephobia.com/package/alova)
[![tree shaking](https://badgen.net/bundlephobia/tree-shaking/alova)](https://bundlephobia.com/package/alova)
![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

## 🔥Documentation

[https://alova.js.org](https://alova.js.org)

## 🚀 Features

- 🕶 Provide a unified experience in the vue, react, and svelte, and seamlessly transplant
- 📑 The api design is similar to axios, more simple and familiar
- 🍵 Out-of-the-box high-performance request strategy, making the application smoother
- 🐦 4kb+, only 30% of axios+
- 🔩 High flexibility, compatible with any request library, such as axios, superagent or fetch-api
- 🔋 3 data cache modes to improve request performance and reduce server pressure
- 🔌 Rich extension functions, you can customize request adapter, storage adapter, middleware, and states hook
- 🖥️ [2.2.0+]Server-side rendering(SSR)
- 💕 Request sharing to avoid sending the same request at the same time
- 🪑 Data pre-fetching, which means users can see information faster without waiting
- 🦾 Real-time automatic status management
- 🎪 Interactive documentation and examples
- 🎈Typescript support
- ⚡ Support tree shaking, which means that the production volume of alova is often less than 4kb

## alova request strategy list

Alova is the core library, which provides common functions such as caching strategy, request sharing strategy, and state management, and can meet more than 99% of request requirements. At the same time, alova also provides business logic and frequently used request strategy hooks, which can be directly used in specific scenarios. The following is a list of request policy hooks provided by alova.

| Name                                    | Description                                                                                                                                                                                                        | Documentation                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Paging request strategy                 | Automatically manage paging data, data preloading, reduce unnecessary data refresh, improve fluency by 300%, reduce coding difficulty by 50%                                                                       | [usePagination](https://alova.js.org/tutorial/strategy/usePagination)                           |
| Non-inductive data interaction strategy | A new interactive experience, submitting and responding, greatly reducing the impact of network fluctuations, making your application still available when the network is unstable or even disconnected            | [useSQRequest](https://alova.js.org/tutorial/strategy/sensorless-data-interaction/overview)     |
| Form Submission Strategy                | A hook designed for form submission, through which you can easily implement form drafts, multi-page (multi-step) forms, in addition to providing common functions such as form reset                               | [useForm](https://alova.js.org/tutorial/strategy/useForm)                                       |
| Send Verification Code                  | Verification code sending hook, which saves you the trouble of developing the verification code sending function.                                                                                                  | [useCaptcha](https://alova.js.org/tutorial/strategy/useCaptcha)                                 |
| Cross-component trigger request         | An alova middleware that removes the limitation of component hierarchy and quickly triggers the operation function of any request in any component                                                                 | [actionDelegationMiddleware](https://alova.js.org/tutorial/strategy/actionDelegationMiddleware) |
| serial request useRequest               | A more concise and easy-to-use serial request use hook than [alova's serial request method](https://alova.js.org/tutorial/next-step/serial-request), providing a unified loading Status, error, callback function  | [useSerialRequest](https://alova.js.org/tutorial/strategy/useSerialRequest)                     |
| Serial request useWatcher               | A more concise and easy-to-use serial request use hook than [alova's serial request method](https://alova.js.org/tutorial/next-step/serial-request), providing a unified loading Status, error, callback function. | [useSerialWatcher](https://alova.js.org/tutorial/strategy/useSerialWatcher)                     |
| Request Retry Strategy                  | Automatic retry on request failure, it plays an important role in important requests and polling requests                                                                                                          | [useRetriableRequest](https://alova.js.org/tutorial/strategy/useRetriableRequest)               |

### More request-related business scenarios are being collected...

If you still have a specific and typical business request scene which we havn't implemented yet, you can [submit an issue](https://github.com/alovajs/scene/issues/new/choose) here, or you can also customize the request hook, please see the [Advanced](/category/advanced) section.

## Examples

[The examples here will show the power of alova.](https://alova.js.org/category/examples)

## What relationship with request libraries

The original intention of alova is to propose a solution for different request scenarios. It can implement request functions with better experience and performance more concisely and elegantly. It is an RSM implementation library, such as $.ajax, axios and fetch-api. It provides good support for request sending and response receiving. They are an indispensable part of the RSM process (request event link), and alova still needs to rely on them for requests, so we can regard alova as a request library. An armament that makes the request library even more powerful.

## Library Stability

It has been more then one year since the first version of alova. During this year, we have been continuously discovering and optimizing problems. So far, alova has passed 170+ unit tests, with a coverage rate of 99%. and it almost in a stable state. Even so, alova is still a rookie, it still has a large development space.

## We really need your star

If you like alova. we are very appreciate your star at the topright. it's a approval and encourage of our work.

## To replace other request libraries?

alova is a request strategy library, which was originally created to provide specific request strategy solutions for different request scenarios, so as to achieve a smooth request experience more concisely and elegantly, such as `$.ajax`, `axios` and `fetch- api`, etc. they has provided a good support for network communication, they are an essential link (request event) in the [RSM](https://alova.js.org/tutorial/get-started/RSM) process, alova still needs to depend them to send requests, Therefore, we can regard alova as an arm of the request library, making the request library more powerful.

## Why binding UI framework?

Decoupling a js library means using it in more scenarios. For example, axios can be used in nodejs, but it also means that developers need to write more template code, such as using useHooks to encapsulate axios. However, alova abandons more usage scenarios brought about by decoupling, and positions the scope of use in conjunction with the UI framework to use alova in the most streamlined way. This is for the benefit of developers and is prevalent in a UI framework. Sometimes, deep binding can provide developers with direct-use functions and improve the developer's experience without requiring too much template code.

## Size comparison with other libraries

| alova                                                                                             | axios                                                                                             | react-query                                                                                                   | vue-request                                                                                                   | vue                                                                                           | react                                                                                                     |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [![minzip](https://badgen.net/bundlephobia/minzip/alova)](https://bundlephobia.com/package/alova) | [![minzip](https://badgen.net/bundlephobia/minzip/axios)](https://bundlephobia.com/package/axios) | [![minzip](https://badgen.net/bundlephobia/minzip/react-query)](https://bundlephobia.com/package/react-query) | [![minzip](https://badgen.net/bundlephobia/minzip/vue-request)](https://bundlephobia.com/package/vue-request) | [![minzip](https://badgen.net/bundlephobia/minzip/vue)](https://bundlephobia.com/package/vue) | [![minzip](https://badgen.net/bundlephobia/minzip/react-dom)](https://bundlephobia.com/package/react-dom) |

## What is Request Scene Model (RSM)

[Click here to view the detailed introduction](https://alova.js.org/tutorial/get-started/RSM)

## Install

```bash
# use npm
npm install alova --save

# use yarn
yarn add alova
```

## Usage

[Usage is here](https://alova.js.org/tutorial/get-started/quick-start)

## Request scene collection

If you have thought of some specific and typical business request scenarios, you can [submit an issue](https://github.com/alovajs/scene/issues/new/choose) to tell us here, and we will implement it for More people use.

## Official Ecosystem

| Resources                                                          | Description                                  |
| ------------------------------------------------------------------ | -------------------------------------------- |
| [@alova/mock](https://github.com/alovajs/mock)                     | Mock request adapter for alova.js            |
| [@alova/scene-react](https://github.com/alovajs/scene)             | react request strategy library for alova.js  |
| [@alova/scene-vue](https://github.com/alovajs/scene)               | vue request strategy library for alova.js    |
| [@alova/scene-svelte](https://github.com/alovajs/scene)            | svelte request strategy library for alova.js |
| [@alova/adapter-uniapp](https://github.com/alovajs/adapter-uniapp) | uniapp adapter for alova.js                  |
| [@alova/adapter-taro](https://github.com/alovajs/adapter-taro)     | taro adapter for alova.js                    |
| [@alova/adapter-axios](https://github.com/alovajs/adapter-axios)   | axios adapter for alova.js                   |
| [@alova/adapter-xhr](https://github.com/alovajs/adapter-xhr)       | XMLHttpRequest adapter for alova.js          |

## Welcome to contribute

Since its official propaganda in April 2023, alova has received 1500+ stars within 3 months.

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

## Welcome to submit a issue

If you encounter difficulties when using alova, whether it is a bug, or an unmet feature, you can [submit an issue](https://github.com/alovajs/alova/issues).

## LICENSE

[MIT](https://en.wikipedia.org/wiki/MIT_License)
