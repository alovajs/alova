---
'alova': patch
'@alova/shared': patch
---

Fix a memory leak where `onSuccess`/`onError`/`onComplete` handlers registered by descendant components (e.g. via `v-for`) were not unbound when the component unmounted, causing them to accumulate in the event manager. Handlers are now automatically removed on unmount through the framework's `onUnmounted`. Also fixed `createEventManager.on` re-introducing already-removed handlers when multiple handlers of the same event type are removed.
