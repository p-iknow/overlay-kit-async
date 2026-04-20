# overlay-kit-async

Fork of [toss/overlay-kit](https://github.com/toss/overlay-kit) with fixed `overlay.openAsync`: the Promise always resolves. With `defaultValue` → `Promise<T>` resolved with the default on external close. Without `defaultValue` → `Promise<T | undefined>` resolved with `undefined` on external close. No more pending promises.

## Where to look

| Task | Location |
|------|----------|
| Core overlay logic (`createOverlay`) | `packages/src/event.ts` |
| `openAsync` external-close resolution | `packages/src/event.ts` |
| State management (reducer actions) | `packages/src/context/reducer.ts` |
| Provider factory | `packages/src/context/provider/index.tsx` |
| Public API surface | `packages/src/utils/create-overlay-context.tsx` |
| Event bridge + `subscribeEvent` | `packages/src/utils/create-use-external-events.ts` |
| Deep dives | `internal-docs/` |

## Commands

```bash
pnpm install
pnpm --filter overlay-kit-async build
pnpm --filter overlay-kit-async test
pnpm lint
```

## Release

Changeset-based. `pnpm changeset` → merge PR → auto Version PR → merge → `release.yml` publishes to npm. Details in `internal-docs/05-release-flow/`.
