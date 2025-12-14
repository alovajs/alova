# alova

## 3.4.1

### Patch Changes

- [#781](https://github.com/alovajs/alova/pull/781) [`c378221`](https://github.com/alovajs/alova/commit/c3782216cb4ca0380104322d4b68858c81fd4184) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - fix that cannot reduce page when remove item in only 1 item

- [#781](https://github.com/alovajs/alova/pull/781) [`c378221`](https://github.com/alovajs/alova/commit/c3782216cb4ca0380104322d4b68858c81fd4184) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - fix that alova default l2 cache is only clear what alova creates

- Updated dependencies [[`c378221`](https://github.com/alovajs/alova/commit/c3782216cb4ca0380104322d4b68858c81fd4184)]:
  - @alova/shared@1.3.2

## 3.4.0

### Minor Changes

- [#778](https://github.com/alovajs/alova/pull/778) [`bd104d3`](https://github.com/alovajs/alova/commit/bd104d347d67c7f1f2678f850904d413d7b3e2be) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - alova/server: add server hook of `atomize` which can keep atomic request in multiple processes`

- [#778](https://github.com/alovajs/alova/pull/778) [`bd104d3`](https://github.com/alovajs/alova/commit/bd104d347d67c7f1f2678f850904d413d7b3e2be) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - alova/fetch: headers will be ignored when set to the falsy value.

- [#778](https://github.com/alovajs/alova/pull/778) [`bd104d3`](https://github.com/alovajs/alova/commit/bd104d347d67c7f1f2678f850904d413d7b3e2be) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - core: return promise from abort function, which will resolve after aborting

## 3.3.4

### Patch Changes

- [#724](https://github.com/alovajs/alova/pull/724) [`ccb53aa`](https://github.com/alovajs/alova/commit/ccb53aab6d8ec6af6694b4ec2f15f850e6163ef8) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix: incorrect expose type of `eventSource` (#727)

- [#724](https://github.com/alovajs/alova/pull/724) [`ccb53aa`](https://github.com/alovajs/alova/commit/ccb53aab6d8ec6af6694b4ec2f15f850e6163ef8) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix: infinite reconnect when server disconnect (#716)

  Added `reconnectionTime` to `0`, it means no reconnect.

  If `reconnectionTime` is not set, useSSE respects the `retry` field returned by server now.

- [#725](https://github.com/alovajs/alova/pull/725) [`bec1570`](https://github.com/alovajs/alova/commit/bec1570ebf9b30da2cbed0ed07ba414350bad594) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix: typo in d.ts

## 3.3.3

### Patch Changes

- [#722](https://github.com/alovajs/alova/pull/722) [`8ec7f52`](https://github.com/alovajs/alova/commit/8ec7f52122b5c5aa80a93ccc519fc73d14f57659) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - trigger request in usehook calling without `await` in nuxt environment

- [#722](https://github.com/alovajs/alova/pull/722) [`8ec7f52`](https://github.com/alovajs/alova/commit/8ec7f52122b5c5aa80a93ccc519fc73d14f57659) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - compatible with `Event` which is not in browser

- Updated dependencies [[`8ec7f52`](https://github.com/alovajs/alova/commit/8ec7f52122b5c5aa80a93ccc519fc73d14f57659), [`8ec7f52`](https://github.com/alovajs/alova/commit/8ec7f52122b5c5aa80a93ccc519fc73d14f57659)]:
  - @alova/shared@1.3.1

## 3.3.2

### Patch Changes

- [#698](https://github.com/alovajs/alova/pull/698) [`5ef468d`](https://github.com/alovajs/alova/commit/5ef468d786a7d622dc73021ddcdb9ce0a9557908) Thanks [@shlroland](https://github.com/shlroland)! - update the MethodType type to support string extension

- [#719](https://github.com/alovajs/alova/pull/719) [`e7c185f`](https://github.com/alovajs/alova/commit/e7c185f1df379cd5803a2dedc634f1bf7b63291a) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - compare states hook with name string instead of instance

- [#719](https://github.com/alovajs/alova/pull/719) [`e7c185f`](https://github.com/alovajs/alova/commit/e7c185f1df379cd5803a2dedc634f1bf7b63291a) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - refactor the feature multiple form in `useForm`

## 3.3.1

### Patch Changes

- [#712](https://github.com/alovajs/alova/pull/712) [`97b45e7`](https://github.com/alovajs/alova/commit/97b45e7afe496a670f01294515c1e30fd2cce24e) Thanks [@36Dyyds](https://github.com/36Dyyds)! - fix:https://github.com/alovajs/alova/issues/711

## 3.3.0

### Minor Changes

- [#682](https://github.com/alovajs/alova/pull/682) [`5462ca9`](https://github.com/alovajs/alova/commit/5462ca9b40f0ea9a1962c68269f05d556f085cf8) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - add `then` in hook exposure, so that you can call hook with `await` in nuxt3 and use `<suspense>` in vue3

- [#682](https://github.com/alovajs/alova/pull/682) [`f8474a7`](https://github.com/alovajs/alova/commit/f8474a717e2cd95d84070f7bedd6380bfe4cb60d) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - add captcha send and verify server hook

- [#682](https://github.com/alovajs/alova/pull/682) [`309f1da`](https://github.com/alovajs/alova/commit/309f1da5d5ccffd12b02b874b1dd7af97cd8c554) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - add statesHook for nuxt, now the states exported by usehooks is sync between server and client

- [#681](https://github.com/alovajs/alova/pull/681) [`e62297b`](https://github.com/alovajs/alova/commit/e62297b07e3a6e0107f8fef13600290b25798d05) Thanks [@3sonboy](https://github.com/3sonboy)! - feat: change `EventSource` to fetch, add `useUploader`, add actions in `usePagination`

### Patch Changes

- Updated dependencies [[`f8f713b`](https://github.com/alovajs/alova/commit/f8f713bde99c92f234d175c13ab355604ae9d0f8), [`6b843ea`](https://github.com/alovajs/alova/commit/6b843ea91221b169c25b0eb75853658642024881), [`e62297b`](https://github.com/alovajs/alova/commit/e62297b07e3a6e0107f8fef13600290b25798d05)]:
  - @alova/shared@1.3.0

## 3.2.13

### Patch Changes

- Updated dependencies [[`c238c37`](https://github.com/alovajs/alova/commit/c238c379c7b55888cad0c8ed4dee7a572f05444d)]:
  - @alova/shared@1.2.0

## 3.2.12

### Patch Changes

- [#687](https://github.com/alovajs/alova/pull/687) [`70ccbee`](https://github.com/alovajs/alova/commit/70ccbee3307fc5e12d2a8b57a76f279116893fea) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - fix that cannot update state which is the same key but distribute in different component

- [#686](https://github.com/alovajs/alova/pull/686) [`4196f50`](https://github.com/alovajs/alova/commit/4196f5053dbd584c393b02f79ba90dd449158534) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - delay update `isLastPage` so that it can wait for the `loading` state to be updated

## 3.2.11

### Patch Changes

- [#677](https://github.com/alovajs/alova/pull/677) [`5208b2b`](https://github.com/alovajs/alova/commit/5208b2b13f9f444c6d3d98e2bc74647591ea29d4) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix(types): correct type declaration of `accessAction()`
  fix(test): ensure vitest runs typecheck correctly

  - correct vitest config to enable typecheck for specific test file

- [#676](https://github.com/alovajs/alova/pull/676) [`b04361a`](https://github.com/alovajs/alova/commit/b04361af0a65e9b0736b09f130596f1aa7c641e3) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix: fix the issue where the on method in useSSE cannot be chained

## 3.2.10

### Patch Changes

- [#649](https://github.com/alovajs/alova/pull/649) [`68f6d16`](https://github.com/alovajs/alova/commit/68f6d167ce8264778dc6a121af09a72981dd506e) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - fix that l2Cache is not defined in `invalidateCache`

## 3.2.9

### Patch Changes

- [#644](https://github.com/alovajs/alova/pull/644) [`466f837`](https://github.com/alovajs/alova/commit/466f837a6ec7f61975ed7e8d37ca04c2bfeb3bbc) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - shouldn't check l2 cache in memory mode when invalidate cache

## 3.2.8

### Patch Changes

- [#629](https://github.com/alovajs/alova/pull/629) [`55a9cc0`](https://github.com/alovajs/alova/commit/55a9cc06f262e708ce473e04f1c7b0a05143be79) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - fix that mismatching cache when items clear in last page

- [#627](https://github.com/alovajs/alova/pull/627) [`92e83a1`](https://github.com/alovajs/alova/commit/92e83a1e85a2a81fdaca945b18ea9ad4dcfe12e8) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix: cannot force send request in restore cache mode

## 3.2.7

### Patch Changes

- [#608](https://github.com/alovajs/alova/pull/608) [`9e95069`](https://github.com/alovajs/alova/commit/9e95069b0fee0e86edb750f4bd5ab2c60083bcaa) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - fix that cannot receive custom params call send `send` in `usePagination`

- Updated dependencies [[`9e95069`](https://github.com/alovajs/alova/commit/9e95069b0fee0e86edb750f4bd5ab2c60083bcaa)]:
  - @alova/shared@1.1.2

## 3.2.6

### Patch Changes

- [#602](https://github.com/alovajs/alova/pull/602) [`cf0b04a`](https://github.com/alovajs/alova/commit/cf0b04a82829c116232d487c046fec3c563f8a8e) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - fix that `fromCache` is undefined in cache hit console

- [#602](https://github.com/alovajs/alova/pull/602) [`cf0b04a`](https://github.com/alovajs/alova/commit/cf0b04a82829c116232d487c046fec3c563f8a8e) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - do not share request when special request body is exists

- [#602](https://github.com/alovajs/alova/pull/602) [`cf0b04a`](https://github.com/alovajs/alova/commit/cf0b04a82829c116232d487c046fec3c563f8a8e) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - split response and cache data with different reference value

- [#602](https://github.com/alovajs/alova/pull/602) [`cf0b04a`](https://github.com/alovajs/alova/commit/cf0b04a82829c116232d487c046fec3c563f8a8e) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - correct default `multiplier` 0 to 1 in comment

- Updated dependencies [[`cf0b04a`](https://github.com/alovajs/alova/commit/cf0b04a82829c116232d487c046fec3c563f8a8e)]:
  - @alova/shared@1.1.1

## 3.2.5

### Patch Changes

- [#600](https://github.com/alovajs/alova/pull/600) [`cb52b76`](https://github.com/alovajs/alova/commit/cb52b76a9c56f35efb2ddbc8d02d11d865841dac) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - fix: setting the cached data if found on useRequest initialization

- [#598](https://github.com/alovajs/alova/pull/598) [`15a99af`](https://github.com/alovajs/alova/commit/15a99af6787b453a62990692a2302bdedbeadd80) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix: resolve issue with delegateMiddleware using outdated context in react

## 3.2.4

### Patch Changes

- [#589](https://github.com/alovajs/alova/pull/589) [`2ea4916`](https://github.com/alovajs/alova/commit/2ea49169a279dfa1e30a847bc555adbcd6215ae5) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix: remove `page` and `pageSize` parameters from usePagination's send function

## 3.2.3

### Patch Changes

- [#585](https://github.com/alovajs/alova/pull/585) [`00ef3ba`](https://github.com/alovajs/alova/commit/00ef3baec9a055a8a6bdc2cadd6d3c42cd3e8528) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix: allow middleware to interrupt requests in `usePagination`

## 3.2.2

### Patch Changes

- [#581](https://github.com/alovajs/alova/pull/581) [`0e8be7c`](https://github.com/alovajs/alova/commit/0e8be7c848ce5227d89251b01e7ecc2c52a1d7fe) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - fix that debounce not effect in react

## 3.2.1

### Patch Changes

- [#578](https://github.com/alovajs/alova/pull/578) [`873e457`](https://github.com/alovajs/alova/commit/873e457796d203b43ab63cbac535e0d938d99b8b) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - export `statesHookHelper` from `alova/client`

## 3.2.0

### Minor Changes

- [#576](https://github.com/alovajs/alova/pull/576) [`433320f`](https://github.com/alovajs/alova/commit/433320f7f1507bc2cd12baee9db0e6c5d9c5dab9) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - add solid statesHook, and now solidjs is supported

### Patch Changes

- [#576](https://github.com/alovajs/alova/pull/576) [`433320f`](https://github.com/alovajs/alova/commit/433320f7f1507bc2cd12baee9db0e6c5d9c5dab9) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - fix that not request immediately when set `immediate` and `store` to true

- [#576](https://github.com/alovajs/alova/pull/576) [`433320f`](https://github.com/alovajs/alova/commit/433320f7f1507bc2cd12baee9db0e6c5d9c5dab9) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - move the debounce function of all statesHook to unified place.

- Updated dependencies [[`433320f`](https://github.com/alovajs/alova/commit/433320f7f1507bc2cd12baee9db0e6c5d9c5dab9)]:
  - @alova/shared@1.1.0

## 3.1.1

### Patch Changes

- [#569](https://github.com/alovajs/alova/pull/569) [`ebb1e6e`](https://github.com/alovajs/alova/commit/ebb1e6e911a2b61353305c55c4c8fcc2e2ad270d) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix: correct type inconsistency between the form arg of handler and initialData in `useForm`

- Updated dependencies [[`ebb1e6e`](https://github.com/alovajs/alova/commit/ebb1e6e911a2b61353305c55c4c8fcc2e2ad270d)]:
  - @alova/shared@1.0.7

## 3.1.0

### Minor Changes

- [#563](https://github.com/alovajs/alova/pull/563) [`ea20f56`](https://github.com/alovajs/alova/commit/ea20f564e5f33795959524d22a68f3ca4a305c1c) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - the function `refresh` and `reload` return by `usePagination` will return a promise

### Patch Changes

- [#563](https://github.com/alovajs/alova/pull/563) [`ea20f56`](https://github.com/alovajs/alova/commit/ea20f564e5f33795959524d22a68f3ca4a305c1c) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - loading value depends on `immdediate` event if `middleware` is set

- [#563](https://github.com/alovajs/alova/pull/563) [`ea20f56`](https://github.com/alovajs/alova/commit/ea20f564e5f33795959524d22a68f3ca4a305c1c) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - feat: add inference for send arguments

- [#563](https://github.com/alovajs/alova/pull/563) [`ea20f56`](https://github.com/alovajs/alova/commit/ea20f564e5f33795959524d22a68f3ca4a305c1c) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - optimize the type `Method` to extend `Promise`

- Updated dependencies [[`ea20f56`](https://github.com/alovajs/alova/commit/ea20f564e5f33795959524d22a68f3ca4a305c1c)]:
  - @alova/shared@1.0.6

## 3.0.20

### Patch Changes

- [#560](https://github.com/alovajs/alova/pull/560) [`2b5898a`](https://github.com/alovajs/alova/commit/2b5898aad1b9606342ec7813e647785ac9c16bca) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - recovery previous version

## 3.0.19

### Patch Changes

- [#557](https://github.com/alovajs/alova/pull/557) [`b2f5379`](https://github.com/alovajs/alova/commit/b2f5379dfa6eb8df1e284bb7253f7ce64ac7057e) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - publish fetch.d.cts

## 3.0.18

### Patch Changes

- [#549](https://github.com/alovajs/alova/pull/549) [`80cdea9`](https://github.com/alovajs/alova/commit/80cdea9c820273d8fa733b19c6a69c4e410d33ad) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - fix that cannot found alova/fetch in ts5.6

## 3.0.17

### Patch Changes

- [#546](https://github.com/alovajs/alova/pull/546) [`800181d`](https://github.com/alovajs/alova/commit/800181d46259ba044385a4252fe7256644a39451) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - unified the request that the types contain request body to be `undefined`

## 3.0.16

### Patch Changes

- [#532](https://github.com/alovajs/alova/pull/532) [`e3e125f`](https://github.com/alovajs/alova/commit/e3e125fda442d58abe534dc019f616e05de6ab19) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - modify README.md

## 3.0.15

### Patch Changes

- [#528](https://github.com/alovajs/alova/pull/528) [`103a1b1`](https://github.com/alovajs/alova/commit/103a1b1f9865170f080c623d4a37d82ab2a386bf) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix: correct exposure type of useHook

## 3.0.14

### Patch Changes

- Updated dependencies [[`6ec9e42`](https://github.com/alovajs/alova/commit/6ec9e42d93b73307d49e0917ac41cccf4f995f11)]:
  - @alova/shared@1.0.5

## 3.0.13

### Patch Changes

- [#517](https://github.com/alovajs/alova/pull/517) [`de4fc6a`](https://github.com/alovajs/alova/commit/de4fc6a56240026e5c68b233dd8eb358d422e9a2) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - fix formData typof of `useForm`

## 3.0.12

### Patch Changes

- [#514](https://github.com/alovajs/alova/pull/514) [`b6816d5`](https://github.com/alovajs/alova/commit/b6816d53b1bb5b94cf5e0fa0e93ae662d8e0f368) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - modify key `listData` to `data` in `usePagination`

## 3.0.11

### Patch Changes

- [#511](https://github.com/alovajs/alova/pull/511) [`3dc0328`](https://github.com/alovajs/alova/commit/3dc032868ddb97f73790c8f5780cb069c3311d51) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - to be effective for `usePagination` when calling `updateState`

## 3.0.10

### Patch Changes

- [#508](https://github.com/alovajs/alova/pull/508) [`f117787`](https://github.com/alovajs/alova/commit/f117787628ae49c283d3c3be6dfa4a3f1344e10d) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix: `msBeforeNext` not reduce in server/rate-limit (#462)

## 3.0.9

### Patch Changes

- [#503](https://github.com/alovajs/alova/pull/503) [`06f811d`](https://github.com/alovajs/alova/commit/06f811db0408a2a9f55892c0b686550dcb09e578) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - uploading and downloading from usehooks do not update by calling send in react

## 3.0.8

### Patch Changes

- [#499](https://github.com/alovajs/alova/pull/499) [`9509427`](https://github.com/alovajs/alova/commit/95094271583cc10034ec701594832b3cbc5913e1) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - fix that statesHook vue-demi is not found

## 3.0.7

### Patch Changes

- [#497](https://github.com/alovajs/alova/pull/497) [`6fb5e32`](https://github.com/alovajs/alova/commit/6fb5e32059b42aec9bada5b1fd2cf39b68d57eaa) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix: incorrect type inference to statehook

## 3.0.6

### Patch Changes

- [#494](https://github.com/alovajs/alova/pull/494) [`5b9ac16`](https://github.com/alovajs/alova/commit/5b9ac161025764272b19ea30becb76b564af11e1) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - compatible with preact when using react

## 3.0.5

### Patch Changes

- [#490](https://github.com/alovajs/alova/pull/490) [`5b381b4`](https://github.com/alovajs/alova/commit/5b381b4c4cbfd802f8c80f17ad373b094e4606df) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix: ssr in codesandbox

- [#490](https://github.com/alovajs/alova/pull/490) [`1216a45`](https://github.com/alovajs/alova/commit/1216a45a088e37e89bc98d9c67eb99035083330d) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - use the newest params to request modified in `beforeRequest`

- Updated dependencies [[`5b381b4`](https://github.com/alovajs/alova/commit/5b381b4c4cbfd802f8c80f17ad373b094e4606df)]:
  - @alova/shared@1.0.4

## 3.0.4

### Patch Changes

- [#486](https://github.com/alovajs/alova/pull/486) [`e0b0f48`](https://github.com/alovajs/alova/commit/e0b0f48c17c5d2fc9956588944f471e4c99143eb) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - fix that form typo of useForm, support async function in authentication

- [#486](https://github.com/alovajs/alova/pull/486) [`e0b0f48`](https://github.com/alovajs/alova/commit/e0b0f48c17c5d2fc9956588944f471e4c99143eb) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - update local deps value

- Updated dependencies [[`e0b0f48`](https://github.com/alovajs/alova/commit/e0b0f48c17c5d2fc9956588944f471e4c99143eb)]:
  - @alova/shared@1.0.3

## 3.0.3

### Patch Changes

- [#482](https://github.com/alovajs/alova/pull/482) [`b4deaef`](https://github.com/alovajs/alova/commit/b4deaef6fb6f90740d212bfad7632cfc6c4d44d2) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - use the newest params to request modified in `beforeRequest`

## 3.0.2

### Patch Changes

- Updated dependencies [[`1ecb1c6`](https://github.com/alovajs/alova/commit/1ecb1c6924b65f24c1477340eb8f1f843083c3c4)]:
  - @alova/shared@1.0.2

## 3.0.1

### Patch Changes

- [#471](https://github.com/alovajs/alova/pull/471) [`7a888c8`](https://github.com/alovajs/alova/commit/7a888c87c9e4153402765e46c40dfcb6c0c680e6) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - STL version publish

- Updated dependencies [[`7a888c8`](https://github.com/alovajs/alova/commit/7a888c87c9e4153402765e46c40dfcb6c0c680e6)]:
  - @alova/shared@1.0.1

## 3.0.0

### Major Changes

- [#398](https://github.com/alovajs/alova/pull/398) [`46a776c`](https://github.com/alovajs/alova/commit/46a776c0a988be4e220717aa8339b2bd6af3eef1) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - chore: set packages version to x.0.0

### Minor Changes

- [#399](https://github.com/alovajs/alova/pull/399) [`6a575a4`](https://github.com/alovajs/alova/commit/6a575a464cf8ab074f523258045b5fd988e065fb) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix: wrong usage of parameter

- [#469](https://github.com/alovajs/alova/pull/469) [`34aa76a`](https://github.com/alovajs/alova/commit/34aa76a64bfa810ea077e1dada1eb16654ebf5ba) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - console error when getting uploading progress

- [#401](https://github.com/alovajs/alova/pull/401) [`9252e07`](https://github.com/alovajs/alova/commit/9252e07639446279c86cb58222793b514341f8a7) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix: alova does not export all type declarations

- [#465](https://github.com/alovajs/alova/pull/465) [`8486b65`](https://github.com/alovajs/alova/commit/8486b654ed29531377b630b0b434c34e2b39d5db) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - change the name `sendArgs` to `args`

### Patch Changes

- [#453](https://github.com/alovajs/alova/pull/453) [`a5c6dd3`](https://github.com/alovajs/alova/commit/a5c6dd341abe796944ef21fa0c72c1e55cf14c82) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix: cannot stop pushing SilentMethod into queue when using async handler in onBeforePushQueue(#434)

- [#394](https://github.com/alovajs/alova/pull/394) [`467cda5`](https://github.com/alovajs/alova/commit/467cda582262f92a5f859a9d357815be6234bc16) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - chore: add beta tag

- [#419](https://github.com/alovajs/alova/pull/419) [`68482fd`](https://github.com/alovajs/alova/commit/68482fd0f9856052f34e0dc6b8c67ad63bf02040) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix: type error in useHooks update(#420)

- [#463](https://github.com/alovajs/alova/pull/463) [`bf0ca43`](https://github.com/alovajs/alova/commit/bf0ca43613eda751bee134067dfd3494b3a77280) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - commonjs module reference, fix server retry error

- [#410](https://github.com/alovajs/alova/pull/410) [`3cb5874`](https://github.com/alovajs/alova/commit/3cb5874f473a25678285f17f7e193a24a2e9e541) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix: cannot request in uniapp

- [#442](https://github.com/alovajs/alova/pull/442) [`fa6d2bc`](https://github.com/alovajs/alova/commit/fa6d2bc98a71eb8fe76db15b01f99253f2b98413) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - remove the variable `isTesting`

- [#430](https://github.com/alovajs/alova/pull/430) [`0929db3`](https://github.com/alovajs/alova/commit/0929db3830e656eaff90517c38da3739b0eb5917) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - fix that states updating not work with `updateStateEffect` in `alova/client`

- [#457](https://github.com/alovajs/alova/pull/457) [`8ddf112`](https://github.com/alovajs/alova/commit/8ddf1126186d0e5d0ca2e162054ee1bda0078259) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - fix scenes hooks using in vue options style such as usePagination

- [#428](https://github.com/alovajs/alova/pull/428) [`03bca82`](https://github.com/alovajs/alova/commit/03bca821a1f0d18e5c6fc2262756f1af55108a53) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - return response data in `middleware.next` of `useSQRequest`

- [#432](https://github.com/alovajs/alova/pull/432) [`586103f`](https://github.com/alovajs/alova/commit/586103fefdb3ddc1ae8eab40f6c92ebab4f495a8) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - fix that states updating not work with `updateStateEffect` in react

- [#456](https://github.com/alovajs/alova/pull/456) [`5699a02`](https://github.com/alovajs/alova/commit/5699a02c25db2753be994e4acfc4310c239f72a0) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - chore: fix retry and add its unit test

- [#419](https://github.com/alovajs/alova/pull/419) [`9b86038`](https://github.com/alovajs/alova/commit/9b860386429cc6d77d51341e8158d1245a973241) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - chore: use `StateExport` for type inference instead of generics

- [#445](https://github.com/alovajs/alova/pull/445) [`f080d13`](https://github.com/alovajs/alova/commit/f080d138e81ae14a7aa9359a92317c628e527d99) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix: debounce not working in useWatcher

- [#471](https://github.com/alovajs/alova/pull/471) [`bee4de9`](https://github.com/alovajs/alova/commit/bee4de9a494fdbb3bdac24bc9c8e3949709080c5) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - STL version publish

- [#410](https://github.com/alovajs/alova/pull/410) [`abc7cb3`](https://github.com/alovajs/alova/commit/abc7cb3e4c05fa34acc7daaff22ffac103fd9419) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix: export type version for client (#407)

- Updated dependencies [[`6a575a4`](https://github.com/alovajs/alova/commit/6a575a464cf8ab074f523258045b5fd988e065fb), [`7265ba2`](https://github.com/alovajs/alova/commit/7265ba288a6afae27a8d05c4186a87c5a072fbdc), [`467cda5`](https://github.com/alovajs/alova/commit/467cda582262f92a5f859a9d357815be6234bc16), [`bf0ca43`](https://github.com/alovajs/alova/commit/bf0ca43613eda751bee134067dfd3494b3a77280), [`bfde660`](https://github.com/alovajs/alova/commit/bfde660e94eaedd7c4f32b231cdf574a95d36146), [`a45db02`](https://github.com/alovajs/alova/commit/a45db024bf7023420f39d27ea528a17b8c4fc0d7), [`5eaa8aa`](https://github.com/alovajs/alova/commit/5eaa8aaaa7054bca03e78a5352f13ee5b38a32f3), [`fa6d2bc`](https://github.com/alovajs/alova/commit/fa6d2bc98a71eb8fe76db15b01f99253f2b98413), [`73daeab`](https://github.com/alovajs/alova/commit/73daeabefa072324aca0a672c5c423c189c9c224), [`8ddf112`](https://github.com/alovajs/alova/commit/8ddf1126186d0e5d0ca2e162054ee1bda0078259), [`03bca82`](https://github.com/alovajs/alova/commit/03bca821a1f0d18e5c6fc2262756f1af55108a53), [`586103f`](https://github.com/alovajs/alova/commit/586103fefdb3ddc1ae8eab40f6c92ebab4f495a8), [`9b86038`](https://github.com/alovajs/alova/commit/9b860386429cc6d77d51341e8158d1245a973241), [`bee4de9`](https://github.com/alovajs/alova/commit/bee4de9a494fdbb3bdac24bc9c8e3949709080c5), [`8486b65`](https://github.com/alovajs/alova/commit/8486b654ed29531377b630b0b434c34e2b39d5db)]:
  - @alova/shared@1.0.0

## 3.0.0-beta.17

### Minor Changes

- [#469](https://github.com/alovajs/alova/pull/469) [`34aa76a`](https://github.com/alovajs/alova/commit/34aa76a64bfa810ea077e1dada1eb16654ebf5ba) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - console error when getting uploading progress

## 3.0.0-beta.16

### Minor Changes

- [#465](https://github.com/alovajs/alova/pull/465) [`8486b65`](https://github.com/alovajs/alova/commit/8486b654ed29531377b630b0b434c34e2b39d5db) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - change the name `sendArgs` to `args`

### Patch Changes

- Updated dependencies [[`8486b65`](https://github.com/alovajs/alova/commit/8486b654ed29531377b630b0b434c34e2b39d5db)]:
  - @alova/shared@1.0.0-beta.12

## 3.0.0-beta.15

### Patch Changes

- [#463](https://github.com/alovajs/alova/pull/463) [`bf0ca43`](https://github.com/alovajs/alova/commit/bf0ca43613eda751bee134067dfd3494b3a77280) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - commonjs module reference, fix server retry error

- Updated dependencies [[`bf0ca43`](https://github.com/alovajs/alova/commit/bf0ca43613eda751bee134067dfd3494b3a77280)]:
  - @alova/shared@1.0.0-beta.11

## 3.0.0-beta.14

### Patch Changes

- [#457](https://github.com/alovajs/alova/pull/457) [`8ddf112`](https://github.com/alovajs/alova/commit/8ddf1126186d0e5d0ca2e162054ee1bda0078259) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - fix scenes hooks using in vue options style such as usePagination

- [#456](https://github.com/alovajs/alova/pull/456) [`5699a02`](https://github.com/alovajs/alova/commit/5699a02c25db2753be994e4acfc4310c239f72a0) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - chore: fix retry and add its unit test

- Updated dependencies [[`8ddf112`](https://github.com/alovajs/alova/commit/8ddf1126186d0e5d0ca2e162054ee1bda0078259)]:
  - @alova/shared@1.0.0-beta.10

## 3.0.0-beta.13

### Patch Changes

- [#453](https://github.com/alovajs/alova/pull/453) [`a5c6dd3`](https://github.com/alovajs/alova/commit/a5c6dd341abe796944ef21fa0c72c1e55cf14c82) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix: cannot stop pushing SilentMethod into queue when using async handler in onBeforePushQueue(#434)

## 3.0.0-beta.12

### Patch Changes

- [#445](https://github.com/alovajs/alova/pull/445) [`f080d13`](https://github.com/alovajs/alova/commit/f080d138e81ae14a7aa9359a92317c628e527d99) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix: debounce not working in useWatcher

- Updated dependencies [[`7265ba2`](https://github.com/alovajs/alova/commit/7265ba288a6afae27a8d05c4186a87c5a072fbdc)]:
  - @alova/shared@1.0.0-beta.9

## 3.0.0-beta.11

### Patch Changes

- [#442](https://github.com/alovajs/alova/pull/442) [`fa6d2bc`](https://github.com/alovajs/alova/commit/fa6d2bc98a71eb8fe76db15b01f99253f2b98413) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - remove the variable `isTesting`

- Updated dependencies [[`fa6d2bc`](https://github.com/alovajs/alova/commit/fa6d2bc98a71eb8fe76db15b01f99253f2b98413)]:
  - @alova/shared@1.0.0-beta.8

## 3.0.0-beta.10

### Patch Changes

- [#419](https://github.com/alovajs/alova/pull/419) [`68482fd`](https://github.com/alovajs/alova/commit/68482fd0f9856052f34e0dc6b8c67ad63bf02040) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix: type error in useHooks update(#420)

- [#419](https://github.com/alovajs/alova/pull/419) [`9b86038`](https://github.com/alovajs/alova/commit/9b860386429cc6d77d51341e8158d1245a973241) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - chore: use `StateExport` for type inference instead of generics

- Updated dependencies [[`bfde660`](https://github.com/alovajs/alova/commit/bfde660e94eaedd7c4f32b231cdf574a95d36146), [`9b86038`](https://github.com/alovajs/alova/commit/9b860386429cc6d77d51341e8158d1245a973241)]:
  - @alova/shared@1.0.0-beta.7

## 3.0.0-beta.9

### Patch Changes

- [#432](https://github.com/alovajs/alova/pull/432) [`586103f`](https://github.com/alovajs/alova/commit/586103fefdb3ddc1ae8eab40f6c92ebab4f495a8) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - fix that states updating not work with `updateStateEffect` in react

- Updated dependencies [[`586103f`](https://github.com/alovajs/alova/commit/586103fefdb3ddc1ae8eab40f6c92ebab4f495a8)]:
  - @alova/shared@1.0.0-beta.6

## 3.0.0-beta.8

### Patch Changes

- [#430](https://github.com/alovajs/alova/pull/430) [`0929db3`](https://github.com/alovajs/alova/commit/0929db3830e656eaff90517c38da3739b0eb5917) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - fix that states updating not work with `updateStateEffect` in `alova/client`

## 3.0.0-beta.7

### Patch Changes

- [#428](https://github.com/alovajs/alova/pull/428) [`03bca82`](https://github.com/alovajs/alova/commit/03bca821a1f0d18e5c6fc2262756f1af55108a53) Thanks [@JOU-amjs](https://github.com/JOU-amjs)! - return response data in `middleware.next` of `useSQRequest`

- Updated dependencies [[`03bca82`](https://github.com/alovajs/alova/commit/03bca821a1f0d18e5c6fc2262756f1af55108a53)]:
  - @alova/shared@1.0.0-beta.5

## 3.0.0-beta.6

### Patch Changes

- Updated dependencies [[`73daeab`](https://github.com/alovajs/alova/commit/73daeabefa072324aca0a672c5c423c189c9c224)]:
  - @alova/shared@1.0.0-beta.4

## 3.0.0-beta.5

### Patch Changes

- Updated dependencies [[`a45db02`](https://github.com/alovajs/alova/commit/a45db024bf7023420f39d27ea528a17b8c4fc0d7)]:
  - @alova/shared@1.0.0-beta.3

## 3.0.0-beta.4

### Patch Changes

- [#410](https://github.com/alovajs/alova/pull/410) [`3cb5874`](https://github.com/alovajs/alova/commit/3cb5874f473a25678285f17f7e193a24a2e9e541) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix: cannot request in uniapp

- [#410](https://github.com/alovajs/alova/pull/410) [`abc7cb3`](https://github.com/alovajs/alova/commit/abc7cb3e4c05fa34acc7daaff22ffac103fd9419) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix: export type version for client (#407)

## 3.0.0-beta.3

### Minor Changes

- [#401](https://github.com/alovajs/alova/pull/401) [`9252e07`](https://github.com/alovajs/alova/commit/9252e07639446279c86cb58222793b514341f8a7) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix: alova does not export all type declarations

## 3.0.0-beta.2

### Minor Changes

- [#399](https://github.com/alovajs/alova/pull/399) [`6a575a4`](https://github.com/alovajs/alova/commit/6a575a464cf8ab074f523258045b5fd988e065fb) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - fix: wrong usage of parameter

### Patch Changes

- Updated dependencies [[`6a575a4`](https://github.com/alovajs/alova/commit/6a575a464cf8ab074f523258045b5fd988e065fb)]:
  - @alova/shared@1.0.0-beta.2

## 3.0.0-beta.1

### Major Changes

- [#398](https://github.com/alovajs/alova/pull/398) [`46a776c`](https://github.com/alovajs/alova/commit/46a776c0a988be4e220717aa8339b2bd6af3eef1) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - chore: set packages version to x.0.0

### Patch Changes

- Updated dependencies [[`5eaa8aa`](https://github.com/alovajs/alova/commit/5eaa8aaaa7054bca03e78a5352f13ee5b38a32f3)]:
  - @alova/shared@1.0.0-beta.1

## 3.0.1-beta.0

### Patch Changes

- [#394](https://github.com/alovajs/alova/pull/394) [`467cda5`](https://github.com/alovajs/alova/commit/467cda582262f92a5f859a9d357815be6234bc16) Thanks [@MeetinaXD](https://github.com/MeetinaXD)! - chore: add beta tag

- Updated dependencies [[`467cda5`](https://github.com/alovajs/alova/commit/467cda582262f92a5f859a9d357815be6234bc16)]:
  - @alova/shared@1.0.1-beta.0

## 2.19.2

### Patch Changes

- Updated dependencies []:
  - @alova/shared@1.1.0
