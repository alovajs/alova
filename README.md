<p align="center">
  <img width="200px" src="https://alova.js.org/img/logo-text-vertical.png" />
</p>

<p align="center"><b>A lightweight request strategy library, which provides targeted request strategies for different request scenarios to improve application availability and fluency, reduce server pressure, and enable applications to have excellent strategic thinking like a wise man.</b></p>

<p align="center">English | <a href="./README.zh-CN.md">📑中文</a></p>

[![npm](https://img.shields.io/npm/v/alova)](https://www.npmjs.com/package/alova)
[![build](https://github.com/alovajs/alova/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/alovajs/alova/actions/workflows/release.yml)
[![coverage status](https://coveralls.io/repos/github/alovajs/alova/badge.svg?branch=main)](https://coveralls.io/github/alovajs/alova?branch=main)
[![minzipped size](https://badgen.net/bundlephobia/minzip/alova)](https://bundlephobia.com/package/alova)
[![dependency](https://badgen.net/bundlephobia/dependency-count/alova)](https://bundlephobia.com/package/alova)
[![tree shaking](https://badgen.net/bundlephobia/tree-shaking/alova)](https://bundlephobia.com/package/alova)
![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

## 🔥Documentation

[https://alova.js.org](https://alova.js.org)

## 🚀 Features

- 🎪 Interactive docs & demos
- 🕶 Support vue, react, svelte
- 🦾 Real-time automatic status management
- 📑 Similar api design to axios, easier
- 🐦 4kb, only 30%+ of axios
- 👄 Declarative Scenario Request
- 🔩 Flexible: Work with any request library like axios, superagent, or fetch-api
- 🔋 3 response data caching modes
- ✨ Interface data is pre-fetched in any case, which means users can see information faster
- 🖥️ Server-side rendering（SSR）
- 🎈 Typescript support
- 📴 Offline submition
- ⚡ Fully tree shakeable: Only take what you want, bundle size
- 🔌 Rich extension functions, you can customize request adapter, storage adapter, request middleware, states hook

## Examples

[The examples here will show the power of alova.](https://alova.js.org/category/examples)

## What relationship with request libraries

The original intention of alova is to propose a solution for different request scenarios. It can implement request functions with better experience and performance more concisely and elegantly. It is an RSM implementation library, such as $.ajax, axios and fetch-api. It provides good support for request sending and response receiving. They are an indispensable part of the RSM process (request event link), and alova still needs to rely on them for requests, so we can regard alova as a request library. An armament that makes the request library even more powerful.

## Library Stability

It has been nearly a year since the development of the first version of alova. During this year, we have been continuously discovering and optimizing problems. So far, alova has passed 146 unit tests, with a coverage rate of 99%. Even so, alova is still a rookie, so I suggest you use it conservatively.

**I promise to solve it as soon as possible after receiving your issue**

## We really need your star

If you like alova. we are very appreciate your star at the topright. it's a approval of our work.

## Size comparison with other libraries

| alova                                                                                             | axios                                                                                             | react-query                                                                                                   | vue-request                                                                                                   | vue                                                                                           | react                                                                                                     |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [![minzip](https://badgen.net/bundlephobia/minzip/alova)](https://bundlephobia.com/package/alova) | [![minzip](https://badgen.net/bundlephobia/minzip/axios)](https://bundlephobia.com/package/axios) | [![minzip](https://badgen.net/bundlephobia/minzip/react-query)](https://bundlephobia.com/package/react-query) | [![minzip](https://badgen.net/bundlephobia/minzip/vue-request)](https://bundlephobia.com/package/vue-request) | [![minzip](https://badgen.net/bundlephobia/minzip/vue)](https://bundlephobia.com/package/vue) | [![minzip](https://badgen.net/bundlephobia/minzip/react-dom)](https://bundlephobia.com/package/react-dom) |

## What is the request scene model

The request scenario model is based on the perspective of the client. It describes the abstract model of the client from triggering the request intent to receiving the request result. It consists of four stages: request timing, request behavior, request event, and response management. For example, when making a request, you often need to think about the following questions,

1. When the request is made;
2. Whether to display the request status;
3. Do you need to retry the request on failure;
4. How to process the response data;
5. Do you need to encrypt the request parameters;
6. Whether to cache the frequently used response data;
7. How to operate data across pages;
8. How to process requests in a weak or disconnected network environment;
9. ...

`fetch` or `axios` are often more focused on how to interact with the server, but we always need to deal with the above problems by ourselves. These functions that are beneficial to application performance and stability will always allow programmers to write low-maintenance sexual code. The request scene model is to abstract all links from preparing the request to processing the response data, so as to cover the model of the entire CS interaction life cycle from the perspective of the front end. `alova` is a library that requests scene models, it is a supplement to request libraries such as `axios`, not a substitute.

> CS interaction: generally refers to data interaction between all client types and servers

## Request scene model

![RSM](https://alova.js.org/img/rsm-en.png)

## request timing

Describe when a request needs to be made, implemented with `useHook` in `alova`.

- Initialize display data, such as just entering a certain interface or sub-interface;
- Human-computer interaction triggers CS interaction, and the request needs to be changed again, such as page turning, filtering, sorting, fuzzy search, etc.;
- Send requests in an anti-shake manner, avoid view data flickering, and reduce server pressure
- Preloading data, such as preloading the content of the next page in a page, predicting that the user clicks a button to pre-fetch data;
- To operate server data, it is necessary to issue a request for addition, deletion, modification and query, such as submitting data, deleting data, etc.;
- Synchronize server status, such as polling requests in scenarios where data changes rapidly, and re-pull data after operating a certain data;

## Request Behavior

Describes how to process the request, implemented as a Method abstraction in `alova`.

- Placeholder request, when requesting, display loading, skeleton diagram, or real data used last time;
- Cache high-frequency responses, multiple execution requests will use fresh data;
- Multi-request serial and parallel;
- The retry mechanism of important interfaces reduces the probability of request failure caused by network instability;
- Submit silently. When you only care about submitting data, directly respond to the success event after submitting the request, and the background guarantees that the request is successful;
- Offline submission, the submitted data will be temporarily stored locally when offline, and then submitted after the network connection;

## request event

Indicates sending a request with request parameters and getting a response. `alova` can work with any request library or native solution such as `axios`, `fetch`, `XMLHttpRequest`.

## Response management

`alova` makes the response data stateful and manages it in a unified manner, refreshes the view data and operates the cache at the request level, avoids operations at the component level, and is more elegant and unified.

- Remove the cached response data, which will be pulled from the server when the request is made again;
- Update the cached response data, which can update the response data at any location, which is very helpful for updating data across pages;
- Refresh the response data, which can re-refresh the response data at any position, and is also very helpful for updating data across pages;
- Customize the cache setting. When requesting batch data, you can manually set the cache for the batch data one by one, so as to meet the cache hit of subsequent single data;

## Install

```bash
# use npm
npm install alova --save

# use yarn
yarn add alova
```

## Usage

[Usage is here](https://alova.js.org/getting-started/start)

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

## What is next?

### Alova core

- ✅ The storage time can be set as a date object, indicating that it expires at a certain point in time
- ✅ You can set the default cache for different request methods globally. The current default is 500 seconds of memory cache for GET requests
- ✅ Additional state management, get and update additional state across pages and modules
- request error log printing
- ✅ Complete offline submission function, you can submit when you are offline, and you can read offline information when you enter again
- ✅ Request middleware design, which can manually control sending requests, status modification, etc.
- ✅ Retry interval, maximum number of retries, etc. when silent submission fails
- ✅ Request to share
- ✅ Server-side rendering support
- Performance improvements

### Extensions

- ✅ Adapters for each operating environment (Uniapp, Taro)
- Develop extended hooks under different request scenarios through [**alova/scene**](https://github.com/alovajs/scene) library, providing out-of-the-box high-performance and high-experience functions [[Refer to usePagination ](https://alova.js.org/strategy/usePagination)]

## Contribution Guide

Please make sure to read the [Contributing Guide](./CONTRIBUTING.md) before making a pull request.

## Welcome to submit a issue

If you encounter difficulties when using alova, whether it is a bug, or an unmet feature, you can [submit an issue](https://github.com/alovajs/alova/issues).

## LICENSE

[MIT](https://en.wikipedia.org/wiki/MIT_License)
