# packages/src

Library source for `overlay-kit-async`: React Context + `useReducer` + global event-emitter bridge so imperative `overlay.open()` calls can drive a declarative React tree.

## Layout

```
src/
├── event.ts                          # createOverlay() — imperative API factory
├── context/
│   ├── reducer.ts                    # overlayReducer — ADD/OPEN/CLOSE/REMOVE/CLOSE_ALL/REMOVE_ALL
│   └── provider/
│       ├── index.tsx                 # createOverlayProvider()
│       └── content-overlay-controller.tsx
└── utils/
    ├── create-overlay-context.tsx    # Default instance: overlay, OverlayProvider, hooks
    ├── create-use-external-events.ts # [useExternalEvents, createEvent, subscribeEvent]
    ├── create-safe-context.ts
    ├── emitter.ts
    └── random-id.ts
```

## `openAsync` contract

`openAsync` always subscribes to `close` / `closeAll` / `unmount` / `unmountAll`. Resolution discriminates on whether `options.defaultValue` was passed:

- `openAsync(Component, { defaultValue })` → `Promise<T>`, resolves with `defaultValue` on external close
- `openAsync(Component)` → `Promise<T | undefined>`, resolves with `undefined` on external close

Resolution is idempotent — a `resolved` flag guards against double-resolve, and subscriptions are cleaned up on first settle.

## Data flow

```
overlay.open(Component)
  → createEvent('open') → global emitter
  → OverlayProvider listener → dispatch ADD (isOpen=false)
  → ContentOverlayController useEffect → rAF → dispatch OPEN (isOpen=true)

overlay.openAsync(Component, options?)
  → same ADD/OPEN flow wrapped in Promise
  → subscribeEvent on close/closeAll/unmount/unmountAll
  → close(value) inside overlay   → resolve(value)
  → external close/unmount        → resolve(defaultValue ?? undefined)
  → first settle cleans up all subscriptions
```
