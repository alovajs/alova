---
'alova': patch
'@alova/vue-options': patch
---

Unify the request state cache cleanup on component unmount into a single `onUnmounted` handler inside `createRequestState`, so every framework relies on the same lifecycle-based cleanup instead of `@alova/vue-options` registering it separately inside `effectRequest`.

This fixes the issue where `updateState` matched against stale hook instances after a component was unmounted (its callback was invoked 2-3 times instead of the expected 1).
