# alova 贡献指南

中文 | [📑 English](./CONTRIBUTING.md)

你好，很高兴在这遇到你，这是一份详细的 alova 贡献指南，它包含对 alova 各个方面的贡献提供了详细的指导，请继续往下看。

## 前言

在过去的一段时间里，我们在 Github issues 和 Github Disscussion 中收到了来自世界各地的开发者积极参与的信息，深感荣幸，这意味着 alova 正在被越来越多的开发者喜爱。即便如此，alova 也还属于新秀，它依然还有很长一段路需要走。

**我们期望将 alova 打造成每位愿意参与的人的共同项目，我们以开放包容的态度鼓励每个人成为 alova 社区的贡献者。而且，我们认为贡献 alova 不局限于代码贡献，而是参与任何有利于 alova 发展的活动都属于贡献 alova**，现在参与贡献可以为你赢得更多的有效贡献机会，它可以让你为全世界的开发者提供你的价值，即使你是一位初级开发者，只要想法符合 [alova 的使命和设计理念](#alova-使命和设计理念)，也请大方地参与进来！

> 这里有一份[社区行为公约](https://alova.js.org/contributing/code-of-conduct)，请参阅。

## 贡献目录

这里提供 13 个可贡献之处供你选择，但不局限于这些，你可以选择自己希望参与的部分后，链接到对应位置详细阅读：

- [在项目中使用 alova](#在项目中使用-alova)
- [为 alova 点星](#为-alova-点星)
- [报告 bug](#报告-bug)
- [提出新特性想法](#提出新特性想法)
- [Pull Request](#pull-request)
- [基于 alova 编写适配器和策略库](#基于-alova-编写适配器和策略库)
- [参与社区交流/PR review](#参与社区交流pr-review)
- [发布和传播有利于 alova 的信息](#发布和传播有利于-alova-的信息)
- [分享使用经验](#分享使用经验)
- [项目合作](#项目合作)
- [项目捐赠](#项目捐赠)
- [更正或编写文档](#更正或编写文档)
- [翻译文档](#翻译文档)

## alova 使命和设计理念

### alova 使命

alova 的使命为它指出了明确的发展方向，它清晰地定义了 alova 什么应该做。

alova 是一个轻量级的请求策略库，**它的使命就是让开发者在编写少量代码的同时，也能实现更高效地 Client-Server 数据交互**。

对于开发者来说，alova 为他们提供了简单的 api 和开箱即用的高级请求功能，以及各种简单的、高性能的请求策略模块，对于应用的用户来说，它们可以享受到 alova 的高性能数据交互带来的流畅体验，因此，alova 具备了以下特性：

1. 与 axios 相似的 api 设计，让使用者学习成本更低；
2. 深度绑定 UI 框架，大大提高开发者的使用收益；
3. 开箱即用的高级功能，避免重复封装，例如请求共享、请求缓存等，减少开发者重复封装；
4. 平台无关的编码方式，可无缝移植；
5. 高扩展性设计，可封装高复用、高性能的业务相关的请求策略；
6. 高聚合低耦合的 method 设计，提高 api 代码维护性；

### alova 设计理念

设计理念指出了它应该如何设计，以下为 alova 的核心设计理念。

1. Method 代理设计，高聚合、平台无关的设计，贯穿请求始终，你在任意请求函数中都应该可以访问到它，从另一个角度说，与请求相关的信息也应该被放在 method 实例中;
2. 轻量级，在编码中尽量保持源码简洁，例如避免重复代码、合并变量声明、原型链函数封装、无相似 api、tree shaking，但长变量名是被允许的，因为在编译时它将会被单个字母替代;
3. 高扩展性设计，其一，alova 的设计中大量使用了适配器模式和钩子函数，例如适配器有`requestAdapter`、`storageAdapter`等，钩子函数有`beforeRequest`、`reseponded`、`transformData`、`localCache`等，而且大多存在默认行为，这样设计的目的是为了在保留高扩展性的同时，使用也足够简单；其二，全局请求参数可覆盖，例如`timeout`、`shareRequest`等，对于特别的请求可单独设置这些参数。
4. api 设计具有普适性，其一，它表示此 api 的功能具有较高的抽象层级，而不是针对某一个具体业务而提出的；其二，api 设计具有可扩展性，以适应 api 的迭代

> api 普适性设计仅适用于 alova 库，如果你正在构思一个请求策略，那么可以根据具体业务来设计。

## 选择你感兴趣的贡献点

### 在项目中使用 alova

我们认为，你们在项目中使用 alova 也是属于 alova 的贡献者，这也是在告诉人们，alova 是值得信任的开源项目，请在[这个 issue](https://github.com/alovajs/alova/issues/165)中提交你的项目，这可能会获得在 alova 官网展示你项目的机会。

### 为 alova 点星

虽然这可能会被认为微不足道，但这代表了你对 alova 的认可，对 alova 来说每一个 star 也是至关重要，请在[alova 的 Github 仓库](https://github.com/alovajs/alova)的右上角为我们点亮星星，这对我们很重要。

### 报告 bug

请移步到[Github new issue](https://github.com/alovajs/alova/issues/new/choose)中选择对应的模板提交，详细说明将会在提交 issue 中展示。

**请注意：** 如果你想问 alova 相关的问题，请到[Github Disscussion](https://github.com/alovajs/alova/discussions)中创建，在 issue 中提问将会被立即关闭。

### 提出新特性想法

为了让 alova 可以实现它的价值和目标，在提交一个新特性想法前，请仔细阅读[alova 使命和设计理念](#alova-使命和设计理念)，并保证你的新想法符合 alova 的使命和设计理念。

然后，请到[🚀 新特性提案](https://github.com/alovajs/alova/issues/new?assignees=&labels=feature-request&projects=&template=FEATURE_REQUEST_zh-CN.yml)中提交，详细说明将会在提交 issue 时展示。

### Pull Request

你可以通过 pull request 贡献以下 3 个方面的代码。如果你是一位有意向参与的新伙伴，在[Github 贡献列表](https://github.com/alovajs/alova/contribute)中列出了所有的`good first issue`的 issues，它用来告诉有兴趣参与贡献的新伙伴，这个是一个好的开始。

#### bug 修改

在 Github issues 中被标记为[`bug:confirmed`](https://github.com/alovajs/alova/labels/bug%3Aconfirmed)的 issues，都是已被确认的 bug，你可以自由选择。

如果你自己遇到了 bug，也请先[报告 bug](#报告-bug)确保 bug 被确认，以避免造成无效的 pull request。

#### 新特性开发

在 Github issues 中被标记为[`feature-request:confirmed`](https://github.com/alovajs/alova/labels/feature-request%3Aconfirmed)的 issues，都是已被确认的新特性，你可以自由选择。

如果你有一个添加新特性的想法，也请先[提交一个新特性想法的 issue](#提出新特性想法)确保想法被确认，以避免造成无效的 pull request。

#### 项目配置

如果你很擅长项目配置，并发现了 alova 项目的不足之处，例如不够完整的配置、配置版本太老旧、自动化不足（包含项目开发自动化和 Github 仓库管理的自动化），你也可以按[新特性开发](#新特性开发)的流程进行贡献。

> 重要
>
> 1. 在开发前请仔细阅读[开发指南](https://alova.js.org/contributing/development-guide)，它可以一步步地指导你如何贡献代码。
> 2. 在你确定了一个需要解决的 issue 时，请确保它没有被其他人的 pull request 标记，它表示已被人先占有。

### 基于 alova 编写适配器和策略库

alova 提供了高扩展特性，你可以基于它编写自己的 js 库。

#### 自定义适配器

自定义各类适配器以满足不同环境下的运行要求，以下几个方向可供参考：

1. 自定义 statesHook，满足在不同 UI 框架下执行，例如`solid/qwik`，目前内置支持`react/vue/svelte`，请阅读[自定义 statesHook](https://alova.js.org/tutorial/advanced/custom-stateshook)；
2. 自定义请求适配器，让 alova 可以与更多请求方案协作，例如`GraphQL/SSE`等；
3. 自定义存储适配器，满足不同环境的存储，例如`react-native`；
4. 以上任意的组合，例如官方的[uniapp 适配器](https://github.com/alovajs/adapter-uniapp)，其中包含了请求适配器、存储适配器。

#### 自定义请求策略

请求策略可以帮助开发者更高效地编写出高性能功能，虽然官方的 [alova/scene](https://alova.js.org/category/strategy) 提供了一些常用的请求策略，但还不足以满足广大开发者各种请求相关的业务场景，基于 alova 自定义你自己的可复用请求策略是一个不错的选择，也可以将它们发布到 npm 上给大家使用。

> 如果你编写了基于 alova 的 js 库，请在[这个 issue](https://github.com/alovajs/alova/issues/165)中提交你的项目，这可以让你的项目获得在 alova 官网展示的机会。

### 参与社区交流/PR review

如果你对技术交流感兴趣，那么参与更多的社区交流可能更适合你，你可以在 Github issues 中参与 bug 和新特性的讨论，也可以在[Github Disscussion](https://github.com/alovajs/alova/discussions)中、微信群、Discord 频道中为别人解答问题，这可以让你与世界各地的人交流，是一件很有趣的事情。

同时，你也可以在[pull request](https://github.com/alovajs/alova/pulls)中参与 PR review，这也是一种交流的主题。

### 发布和传播 alova 的信息

你可以在任何社交平台、短视频平台，或技术分享平台发布或转发传播任何有利于 alova 发展的信息，这有利于提高 alova 的影响力。我们将会筛选出相关的文章或视频在 alova 官网展示它们。这里有一些优质的文章：

- [是时候该换掉你的 axios 了](https://juejin.cn/post/7213923957824979000)
- [（深度）开源框架/库的伟大与罪恶](https://juejin.cn/post/7215608036394729532)
- [Alova.js 筆記－試用相較 axios 更輕量、更高集成的請求庫](https://uu9924079.medium.com/alova-js-%E7%AD%86%E8%A8%98-%E8%A9%A6%E7%94%A8%E7%9B%B8%E8%BC%83-axios-%E6%9B%B4%E8%BC%95%E9%87%8F-%E6%9B%B4%E9%AB%98%E9%9B%86%E6%88%90%E7%9A%84%E8%AB%8B%E6%B1%82%E5%BA%AB-546ec5424df9)

### 分享使用经验

如果你有值得分享的 alova 使用经验，或者较好的实践案例，你可以在[Github Disscussion 的 Practices](https://github.com/alovajs/alova/discussions/categories/practices)中分享，较好的分享也将会在官方文档中展示。

### 项目合作

我们欢迎与任何组织或个人进行项目合作，这可以帮助我们扩大 alova 的影响力，加速项目的发展。如果您有任何合作建议或意向，请发送邮件到**hujou555@gmail.com**与我们联系。

### 项目捐赠

暂未开通，敬请期待...

### 更正或编写文档

如果你需要添加新的文档内容，或发现 alova 的文档有错误，例如错误的示例、错误的用词、描述不正确、或未提及的内容，你可以[新建文档仓库 issue](https://github.com/alovajs/alovajs.github.io/issues/new)，或[新建文档仓库 pull request](https://github.com/alovajs/alovajs.github.io/fork)直接修改错误，这应该是更好的选择，我们欢迎任何对文档的改进建议或贡献。

### 翻译文档

如果你擅长不同的语言，欢迎你为 alova 文档进行翻译，这将有助于扩展 alova 的使用范围和受众群体。

## 成为核心团队成员

具体查看[这边的内容](https://alova.js.org/contributing/become-core-member)
