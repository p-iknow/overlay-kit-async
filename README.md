# overlay-kit-async &middot; [![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/p-iknow/overlay-kit-async/blob/main/LICENSE)

English | [한국어](https://github.com/p-iknow/overlay-kit-async/blob/main/README-ko_kr.md)

`overlay-kit-async` is a fork of [toss/overlay-kit](https://github.com/toss/overlay-kit) that fixes `overlay.openAsync` behavior when an overlay is closed externally. The public API and interface are **identical** to the upstream — you can use it as a drop-in replacement.

## Why this fork?

In upstream `overlay-kit`, `overlay.openAsync` **never resolves** when the overlay is closed via `overlay.close()`, `closeAll()`, `unmount()`, or `unmountAll()`. This causes:

- **Memory leaks** — the unresolved Promise and its closures are never garbage-collected.
- **Deadlocked code paths** — any code awaiting `openAsync` hangs forever.
- **Unexpected UX** — page transitions or global "close all" flows silently break.

See [toss/overlay-kit#169](https://github.com/toss/overlay-kit/issues/169) for the original issue and [toss/overlay-kit#215](https://github.com/toss/overlay-kit/pull/215) for the unreviewed fix PR.

`overlay-kit-async` guarantees that `openAsync` always resolves:

- With `defaultValue` → resolves with that value on external close. Return type is `Promise<T>`.
- Without `defaultValue` → resolves with `undefined` on external close. Return type is `Promise<T | undefined>`.

## Install

```sh
npm install overlay-kit-async
```

## Example

First, add the provider:

```tsx
import { OverlayProvider } from 'overlay-kit-async';

const app = createRoot(document.getElementById('root')!);
app.render(
  <OverlayProvider>
    <App />
  </OverlayProvider>
);
```

### Opening Simple Overlays

You can easily open and close overlays using `overlay.open`.

```tsx
import { overlay } from 'overlay-kit-async';

<Button
  onClick={() => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Dialog open={isOpen} onClose={close} onExit={unmount} />
    ))
  }}
>
  Open
</Button>
```

### Opening Asynchronous Overlays

You can handle overlay results as a `Promise` using `overlay.openAsync`. Unlike upstream, the Promise **always resolves** — even when the overlay is closed externally.

```tsx
import { overlay } from 'overlay-kit-async';

<Button
  onClick={async () => {
    const result = await overlay.openAsync<boolean>(({ isOpen, close, unmount }) => (
      <Dialog
        open={isOpen}
        onConfirm={() => close(true)}
        onClose={() => close(false)}
        onExit={unmount}
      />
    ));

    // result: boolean | undefined
    //   user confirmed  → true
    //   user dismissed  → false
    //   external close  → undefined (no longer pending)
    if (result === undefined) {
      return;
    }
  }}
>
  Open
</Button>
```

If you prefer a non-nullable return type, pass a `defaultValue`:

```tsx
const result = await overlay.openAsync<boolean>(
  ({ isOpen, close }) => (
    <Dialog open={isOpen} onConfirm={() => close(true)} onClose={() => close(false)} />
  ),
  { defaultValue: false }
);
// result: boolean — external close now resolves with `false` instead of `undefined`.
```

## Compatibility with upstream

The surface API (`overlay`, `OverlayProvider`, hooks, types) is **identical** to `toss/overlay-kit`. Migration from upstream is usually just:

```diff
- import { overlay, OverlayProvider } from 'overlay-kit';
+ import { overlay, OverlayProvider } from 'overlay-kit-async';
```

The one behavioral difference is `openAsync`:

| | Upstream | overlay-kit-async |
|---|---|---|
| Internal `close(value)` | resolves with `value` | resolves with `value` |
| External close / closeAll / unmount | **pending forever** ❌ | resolves with `defaultValue` or `undefined` ✅ |
| Return type (without `defaultValue`) | `Promise<T>` | `Promise<T \| undefined>` |

## Why use overlay-kit (and this fork)?

### Problems with Traditional Overlay Management

1. Complexity of State Management
   - Had to manage overlay state directly using useState or global state.
   - Code became complex and less readable as state management mixed with UI logic.
2. Repetitive Event Handling
   - Had to repeatedly write event handling code for opening, closing, and returning results.
   - This led to code duplication and degraded development experience.
3. Lack of Reusability
   - UI and logic were tightly coupled through callback functions to return values from overlays.
   - This made it difficult to reuse components.

### Goals

1. Design Following React Philosophy
   - React favors declarative code.
   - overlay-kit helps manage overlays declaratively.
2. Improve Development Productivity
   - By encapsulating state management and event handling, developers can focus solely on UI and business logic.
3. Enhance Extensibility and Reusability
   - Increased overlay reusability by separating UI and behavior, and returning Promises.

## License

MIT © Viva Republica, Inc. (original) · forked and maintained by [@p-iknow](https://github.com/p-iknow). See [LICENSE](./LICENSE) for details.
