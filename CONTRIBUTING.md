# alova Contribution Guidelines

Hello, I'm glad to meet you here. This is a detailed alova contribution guidelines, which includes detailed guidance on contributing to all aspects of alova. Please continue reading.

## Preface

In the past period of time, we have received active participation information from developers from all over the world in Github issues and Github Discussion, which means that alova is being loved by more and more developers. Even so, alova is still a rookie, and it still has a long way to go.

**We expect to make alova a common project for everyone who is willing to participate, and we encourage everyone to become a contributor to the alova community with an open and inclusive attitude. Moreover, we believe that contributing to alova is not limited to code contributions, but participating in any activities that are beneficial to the development of alova is considered to contribute to alova.** Participating in contributions now can win you more effective contribution opportunities, and it allows you to contribute to the world Even if you are a junior developer, as long as the idea is in line with [alova's mission and design principles](#alova-mission-and-design-principles), please generously participate!

> There is a [Code of conduct](https://alova.js.org/contributing/code-of-conduct) here, please refer to it.

## Contribution directory

Here are 13 places where you can contribute, but not limited to these, you can choose the part you want to participate in, and link to the corresponding location for detailed reading:

- [use alova in your project](#use-alova-in-your-project)
- [star alova](#star-alova)
- [report bug](#report-bug)
- [Propose new feature ideas](#propose-new-feature-ideas)
- [Pull Request](#pull-request)
- [Create an adapter or strategy library based on alova](#create-an-adapter-or-strategy-library-based-on-alova)
- [Participate in community/PR review](#participate-in-community-pr-review)
- [Publish and disseminate information about alova](#publish-and-disseminate-information-about-alova)
- [Share experience](#share-experience)
- [Collaboration](#collaboration)
- [Donation](#donation)
- [Correct or add docs](#correct-or-add-docs)
- [Translate docs](#Translate-docs)

## alova mission and design principles

### alova Mission

alova's mission gives it a clear development direction, which clearly defines what alova should do.

alova is a lightweight request strategy library, **Its mission is to enable developers to achieve more efficient Client-Server data interaction by less codes**.

For developers, alova provides them with a simple API and out-of-the-box advanced request functions, as well as various simple and high-performance request strategy modules. For application users, they can enjoy the benefits of alova The smooth experience brought by high-performance data interaction, therefore, alova has the following features:

1. The api design is similar to axios, allowing users to learn at a lower cost;
2. Deep binding of the UI framework, greatly improving the benefits of developers;
3. Out-of-the-box advanced functions to avoid repeated packaging, such as request sharing, request caching, etc., to reduce developers' repeated packaging;
4. The platform-independent coding method can be seamlessly transplanted;
5. High scalability design, which can encapsulate high-reusability and high-performance business-related request strategies;
6. Highly aggregated and low-coupling method design improves API code maintainability;

### alova design principles

The design principles points out how it should be designed, the following is the core design concept of alova.

1. `Method` proxy design, high aggregation, platform-independent design, throughout the request, you should be able to access it in any request function, from another perspective, the information related to the request should also be placed in the method instance ;
2. Lightweight, try to keep the source code concise in coding, such as avoiding repeated code, merging variable declarations, prototype chain function encapsulation, no similar API, tree shaking, but long variable names are allowed, because it will be used when compiling will be replaced by a single letter;
3. Highly scalable design. First, the design of alova uses a large number of adapter patterns and hook functions. For example, adapters include `requestAdapter`, `storageAdapter`, etc., and hook functions include `beforeRequest`, `responded`, `transformData`, `localCache`, etc., and most of them have default behaviors, which are designed to be easy to use while retaining high scalability; second, global request parameters can be overwritten, such as `timeout`, `shareRequest`, etc., for These parameters can be set individually for special requests.
4. The api design is universal. First, it means that the function of this api has a high level of abstraction, rather than a specific business. Second, the api design is scalable to adapt to the needs of the api iteration

> The api universal design is only applicable to the alova library. If you are conceiving a request strategy, you can design it according to the specific business.

## Select the contribution point you are interested in

### Use alova in your project

We believe that your use of alova in the project is also a contributor to alova, which is also telling people that alova is a trustworthy open source project, please open [this issue](https://github.com/alovajs/alova/issues/165), which may give you the opportunity to display your project on the alova official website.

### Star alova

Although this may be considered insignificant, it represents your recognition of alova, and every star is very important to alova. star alova in the right top of [alova's Github repository](https://github.com/alovajs/alova), which is important to us.

### Report bug

Please move to [Github new issue](https://github.com/alovajs/alova/issues/new/choose) and select the corresponding template to submit. Detailed instructions will be displayed in the submitted issue.

**PLEASE NOTE:** If you want to ask questions about alova, please go to [Github Discussion](https://github.com/alovajs/alova/discussions) to create a question. That would be closed immediately when ask a question in issues.

### Propose new feature ideas

In order for alova to achieve its value and goals, before submitting a new feature idea, please carefully read [alova mission and design principles](#alova-mission-and-design-principles), and ensure that your new idea is in line with alova's mission and design philosophy design concept.

Then, please submit it in [🚀 New Feature Proposal](https://github.com/alovajs/alova/issues/new?assignees=&labels=feature-request&projects=&template=FEATURE_REQUEST_en.yml), the detailed description will be Displayed when submitting an issue.

### Pull Request

You can contribute the following 3 aspects of code through pull request. If you are a new partner who is interested in participating, all `good first issue` issues are listed in [Github contribution list](https://github.com/alovajs/alova/contribute), it is used to Tell new partners who are interested in contributing that this is a good start.

#### Bug fix

Issues marked as [`bug:confirmed`](https://github.com/alovajs/alova/labels/bug%3Aconfirmed) in Github issues are all confirmed bugs, you can choose freely.

If you encounter a bug yourself, please also [report a bug](#report-bug) first to ensure that the bug is confirmed to avoid invalid pull requests.

#### New feature development

Issues marked as [`feature-request:confirmed`](https://github.com/alovajs/alova/labels/feature-request%3Aconfirmed) in Github issues are new features that have been confirmed, you You can choose freely.

If you have an idea for adding a new feature, please also [submit an issue of a new feature idea](#propose-new-feature-ideas) to ensure that the idea is confirmed to avoid invalid pull requests.

#### Project configuration

If you are very good at project configuration and find deficiencies in the alova project, such as incomplete configuration, too old configuration version, insufficient automation (including project development automation and Github warehouse management automation), you can also press [New Feature development](#new-feature-development) process to contribute.

:::caution IMPORTANT

1. Please read the [Developing Guidelines](https://alova.js.org/contributing/developing-guidelines) carefully before developing, it can guide you step by step on how to contribute code.
2. When you identify an issue that needs to be resolved, please make sure that it has not been flagged by someone else's pull request, which means that it has been pre-occupied.

:::

### Create an adapter or strategy library based on alova

alova provides high-extensibility features, and you can write your own js library based on it.

#### Custom Adapter

Customize various adapters to meet the operating requirements in different environments. The following directions are available for reference:

1. Customize statesHook, which can be executed under different UI frameworks, such as `solid/qwik`, currently supports `react/vue/svelte`, please read [Custom statesHook](https://alova.js.org/tutorial/advanced/custom-stateshook);
2. Customize the request adapter, so that alova can cooperate with more request schemes, such as `GraphQL/SSE`, etc.;
3. Customize the storage adapter to meet the storage requirements of different environments, such as `react-native`;
4. Any combination of the above, such as the official [uniapp adapter](https://github.com/alovajs/adapter-uniapp), which includes request adapters and storage adapters.

#### Custom request strategy

Request strategies can help developers write high-performance functions more efficiently. Although the official [alova/scene](https://alova.js.org/category/strategy) provides some common request strategies, it is not enough It is a good choice to customize your own reusable request strategy based on alova to meet the business scenarios related to various requests of developers, and you can also publish them on npm for everyone to use.

:::tip Submit your project

If you have written an alova-based js library, please submit your project in [this issue](https://github.com/alovajs/alova/issues/165), which will allow your project to be displayed on the alova official website Opportunity.

:::

### Participate in community/PR review

If you are interested in technical communication, then it may be more suitable for you to participate in more community communication. You can participate in the discussion of bugs and new features in Github issues, or in [Github Discussion](https://github.com/alovajs/alova/discussions) and Discord channels to answer questions for others, which allows you to communicate with people from all over the world, which is a very interesting thing.

At the same time, you can also participate in PR review in [pull request](https://github.com/alovajs/alova/pulls), which is also a topic of communication.

### Publish and disseminate information about alova

You can publish or repost any information that is beneficial to the development of alova on any social platform, short video platform, or technology sharing platform, which will help increase the influence of alova. We will filter out relevant articles or videos and display them on the alova official website. Here are some good articles:

- [It’s time to replace your axios](https://medium.com/@huzhen555/its-time-to-replace-your-axios-12c014833b04)
- [Alova.js 筆記－試用相較 axios 更輕量、更高集成的請求庫](https://uu9924079.medium.com/alova-js-%E7%AD%86%E8%A8%98-%E8%A9%A6%E7%94%A8%E7%9B%B8%E8%BC%83-axios-%E6%9B%B4%E8%BC%95%E9%87%8F-%E6%9B%B4%E9%AB%98%E9%9B%86%E6%88%90%E7%9A%84%E8%AB%8B%E6%B1%82%E5%BA%AB-546ec5424df9)

### Share experience

If you have alova experience worth sharing, or better practice cases, you can share it in [Github Discussion's Practices channel](https://github.com/alovajs/alova/discussions/categories/practices), better The sharing of will also be displayed in the official documentation.

### Collaboration

We welcome project collaboration with any organization or individual, which can help us expand alova's influence and accelerate the development of the project. If you have any suggestions or intentions for cooperation, please contact us via email **hujou555@gmail.com**.

### Donation

Coming soon...

### Correct or add docs

If you need to add new documentation content, or find errors in alova's documentation, such as wrong examples, wrong words, incorrect descriptions, or unmentioned content, you can [create a new document repository issue](https://github.com/alovajs/alovajs.github.io/issues/new), or [new document warehouse pull request](https://github.com/alovajs/alovajs.github.io/fork) directly modify the error, which should be the better option, and we welcome any suggestions or contributions to improve the documentation.

### Translate Documentation

If you are proficient in different languages, you are welcome to translate the alova documentation, which will help expand the use and audience of alova.

## Become a core team member

Check [HERE](https://alova.js.org/contributing/become-core-member) for details
