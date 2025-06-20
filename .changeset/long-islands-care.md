---
'alova': patch
---

fix: infinite reconnect when server disconnect (#716)

Added the `fetchOptions` option to allow customization. And also allow specify `fetchOptions.reconnectionTime` to `0`, it means no reconnect.

If `fetchOptions.reconnectionTime` is not set, useSSE respects the `retry` field returned by server now.
