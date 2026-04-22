---
'overlay-kit-async': patch
---

Refactor `openAsync` to remove the circular dependency between `subscribeEvent`, `cleanup`, and `resolve`. The subscription lifecycle is now extracted into `subscribeOverlayEnd`, and a new `promiseWithResolver` utility provides the deferred handle so cleanup runs via `promise.finally`. Behavior is unchanged.
