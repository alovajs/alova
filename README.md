<p align="center">
  <img width="200px" src="https://user-images.githubusercontent.com/29848971/202826407-92f17a6a-bc69-4ef8-be6f-001413ca8c90.png" />
</p>

<p align="center"><b>A lightweight request strategy library, which provides targeted request strategies for different request scenarios to improve application availability and fluency, reduce server pressure, and enable applications to have excellent strategic thinking like a wise man.</b></p>

<p align="center">English | <a href="./README.zh-CN.md">📑中文</a></p>

[![npm](https://img.shields.io/npm/v/alova)](https://www.npmjs.com/package/alova)
[![build](https://github.com/alovajs/alova/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/alovajs/alova/actions/workflows/main.yml)
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
- ▪️ 4kb, only 40% of axios
- 👄 Declarative Scenario Request
- 🔩 Flexible: Work with any request library like axios, superagent, or fetch-api
- 🔋 3 response data caching modes
- ✨ Interface data is pre-fetched in any case, which means users can see information faster
- 🎈 Typescript support
- 🖥️ Offline submition
- ⚡ Fully tree shakeable: Only take what you want, bundle size
- ⛑️ Safer optimistic data updates
- 🔌 Rich extension functions, you can customize request adapter, storage adapter, states hook

## Examples

[The examples here will show the power of alova.](https://alova.js.org/category/%E7%A4%BA%E4%BE%8B)

## What relationship with request libraries

The original intention of alova is to propose a solution for different request scenarios. It can implement request functions with better experience and performance more concisely and elegantly. It is an RSM implementation library, such as $.ajax, axios and fetch-api. It provides good support for request sending and response receiving. They are an indispensable part of the RSM process (request event link), and alova still needs to rely on them for requests, so we can regard alova as a request library. An armament that makes the request library even more powerful.

## We really need your star

If you like alova. we are very appreciate your star at the topright. it's a approval of our work.

## Size comparison with other libraries

| alova                                                                                             | axios                                                                                             | react-query                                                                                                   | vue-request                                                                                                   | vue                                                                                           | react                                                                                                     |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [![minzip](https://badgen.net/bundlephobia/minzip/alova)](https://bundlephobia.com/package/alova) | [![minzip](https://badgen.net/bundlephobia/minzip/axios)](https://bundlephobia.com/package/axios) | [![minzip](https://badgen.net/bundlephobia/minzip/react-query)](https://bundlephobia.com/package/react-query) | [![minzip](https://badgen.net/bundlephobia/minzip/vue-request)](https://bundlephobia.com/package/vue-request) | [![minzip](https://badgen.net/bundlephobia/minzip/vue)](https://bundlephobia.com/package/vue) | [![minzip](https://badgen.net/bundlephobia/minzip/react-dom)](https://bundlephobia.com/package/react-dom) |

## What is request scene management

We always have to think about the following questions when making a request,

1. When is the request made;
2. Whether to display the request status;
3. Whether to encapsulate it into a request function for repeated calls;
4. How to process the response data;
5. Whether to cache frequently used response data;
6. How to operate data across pages;
7. Can I still submit data when I am offline?
8. ...

`fetch` or `axios` tend to focus more on how to interact with the server, but we always need to deal with the above problems by ourselves. These functions that are beneficial to application performance and stability will always allow programmers to write low-maintenance functions. sexual code. The request scene management is to abstract all the links from the preparation of the request to the completion of the response data processing, so as to cover the model of the entire CS interaction life cycle from the perspective of the front end. `alova` is a request scene management library based on the request scene model. It is a supplement to the request library such as `axios`, not a replacement.

> CS interaction: refers to all client types and server-side data interaction

## RSM(Request scene model)

![model](https://user-images.githubusercontent.com/29848971/185773573-761b6153-9e6c-42df-b0b7-beddd405833c.png)

### request timing

Describes when a request needs to be made, implemented as `useHook` in `alova`.

- Initialize display data, such as just entering an interface or sub-interface;
- Human-computer interaction triggers CS interaction, which requires changing data to re-issue requests, such as page turning, filtering, sorting, fuzzy search, etc.;
- Pre-loading data, such as pre-loading the content of the next page in a pagination, predicting that the user clicks a button to pre-fetch data;
- To operate server-side data, it is necessary to issue a request for addition, deletion and modification, such as submitting data, deleting data, etc.;
- Synchronize the status of the server, such as polling requests in scenarios where data changes rapidly, and re-pulling data after operating a certain data;

### Request behavior

Describes how to handle the request, implemented as a method instance in `alova`.

- Placeholder request, displaying loading, skeleton diagram, or the last real data used when requesting;
- Cache high-frequency responses, and execute requests multiple times will use fresh data;
- Multi-request serial and parallel;
- Anti-shake for frequent requests, avoid front-end data flashing, and reduce server pressure;
- Important interface retry mechanism to reduce the probability of request failure caused by network instability;
- Silent submit, when you only care about submitting data, directly respond to the success event after submitting the request, and the background ensures that the request is successful;
- Offline submit, temporarily store the submitted data locally when offline, and submit it after network connection;

### request event

Indicates that the request is sent with the request parameters, and the response is obtained. `alova` can cooperate with any request library or native solution such as `axios`, `fetch`, `XMLHttpRequest`.

### Response data management

`alova` will state and manage the response data in a unified manner. The response data can be operated at any location, and the corresponding views can be automatically updated by using the characteristics of the MVVM library.

- Remove the cached response data and pull it from the server when the request is made again;
- Update cache response data, which can update response data at any location, which is very beneficial to update data across pages;
- Refresh the response data, which can re-refresh the response data at any location, and is also very beneficial to update data across pages;
- Custom setting cache, when requesting batch data, you can manually set the cache for batch data one by one, so as to satisfy the cache hit of subsequent single data;

## Install

```bash
# use npm
npm install alova --save

# use yarn
yarn add alova
```

## Usage

[Usage is here](https://alova.js.org/getting-started/start)

## Official Ecosystem

| Resources                                                          | Description                                  |
| ------------------------------------------------------------------ | -------------------------------------------- |
| [@alova/mock](https://github.com/alovajs/mock)                     | Mock request adapter for alova.js            |
| [@alova/scene-react](https://github.com/alovajs/scene)             | react request strategy library for alova.js  |
| [@alova/scene-vue](https://github.com/alovajs/scene)               | vue request strategy library for alova.js    |
| [@alova/scene-svelte](https://github.com/alovajs/scene)            | svelte request strategy library for alova.js |
| [@alova/adapter-uniapp](https://github.com/alovajs/adapter-uniapp) | uniapp adapter for alova.js                  |
| [@alova/adapter-taro](https://github.com/alovajs/adapter-taro)     | taro adapter for alova.js                    |

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
- delayed loading
- Server-side rendering support
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
