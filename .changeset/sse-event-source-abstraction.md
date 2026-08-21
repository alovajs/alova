---
'alova': minor
'@alova/adapter-taro': minor
'@alova/adapter-uniapp': minor
---

Unify `useSSE` across platforms by making the `EventSource` implementation pluggable (`useSSE.EventSource`), ship dedicated `TaroEventSource` / `UniappEventSource` adapters so SSE works on mini-program environments, expose a `loading` reactive state from `useSSE`, and add a shared `throttle` helper.
