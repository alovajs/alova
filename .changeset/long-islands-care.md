---
'alova': patch
---

fix: infinite reconnect when server disconnect (#716)

Added `reconnectionTime` to `0`, it means no reconnect.

If `reconnectionTime` is not set, useSSE respects the `retry` field returned by server now.
