# examples/ — Demo Applications

## OVERVIEW

Vite + @base-ui/react + Tailwind CSS demo apps showcasing overlay-kit API usage. Tested via Vitest Browser Mode + Playwright.

## STRUCTURE

Both react-18 and react-19 share an identical directory structure:

```
examples/
├── react-18/              # Domain-grouped demos with tab navigation
│   ├── src/
│   │   ├── main.tsx        # Entry: OverlayProvider wrapping Demo
│   │   ├── demo.tsx        # Tab navigation across demo groups
│   │   ├── demos/          # Domain-grouped: demo-basic, demo-open-async, demo-open-async-external-close, demo-overlay-control
│   │   └── components/     # alert-dialog.tsx, bottom-sheet.tsx, demo-section.tsx
│   ├── vitest.config.ts    # Browser mode + Playwright
│   └── vite.config.ts      # React + Tailwind plugins
└── react-19/              # Domain-grouped demos with tab navigation (identical structure)
    ├── src/
    │   ├── main.tsx        # Entry: OverlayProvider wrapping Demo
    │   ├── demo.tsx        # Tab navigation across demo groups
    │   ├── demos/          # Domain-grouped: demo-basic, demo-open-async, demo-open-async-external-close, demo-overlay-control
    │   └── components/     # alert-dialog.tsx, bottom-sheet.tsx, demo-section.tsx
    ├── vitest.config.ts
    └── vite.config.ts
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new demo | `react-{ver}/src/demos/` | Create `demo-{name}.tsx` + `demo-{name}.test.tsx`, add to `demo.tsx` tabs. Apply to BOTH examples |
| Add shared UI component | `react-{ver}/src/components/` | Both examples share identical source — keep in sync |
| openAsync defaultValue demo | `react-{ver}/src/demos/demo-open-async-external-close.tsx` | Shows with/without defaultValue side-by-side |
| Stacked overlay demo | `react-{ver}/src/demos/demo-overlay-control.tsx` → `DemoStackedOverlays` | Bottom sheet + alert dialog composition |

## CONVENTIONS

- **@base-ui/react for overlays**: `AlertDialog.Root` / `Dialog.Root` with `open`, `onOpenChange`, `onOpenChangeComplete` — NOT browser-native dialogs
- **`onExited` = unmount bridge**: `onOpenChangeComplete(false)` triggers `onExited?.()` which maps to overlay-kit's `unmount()`. Uses `hasOpenedRef` guard to prevent premature unmount
- **Tailwind utility classes**: No CSS modules, no styled-components — Tailwind only
- **Test pattern**: `renderWithProvider()` helper wraps component in `<OverlayProvider>`. Uses `page.getByRole`/`page.getByText` from `vitest/browser`. Direct `.element().click()` cast for non-async clicks
- **Korean comments in tests**: Given/When/Then comments written in Korean
- **Identical source between examples**: react-18 and react-19 have identical `src/` contents — changes to one must be mirrored in the other

## ANTI-PATTERNS

- **Do not use `@testing-library/react` render** — use `vitest-browser-react`'s `render` (real browser, not jsdom)
- **Do not let examples diverge** — both react-18 and react-19 must have identical source structure and content
- **Do not forget `hasOpenedRef` guard** — without it, `onOpenChangeComplete(false)` fires on initial mount before overlay opens

## COMMANDS

```bash
pnpm --filter @overlay-kit/react-18 run build
pnpm --filter @overlay-kit/react-18 run test
pnpm --filter @overlay-kit/react-18 run dev

pnpm --filter @overlay-kit/react-19 run build
pnpm --filter @overlay-kit/react-19 run test
pnpm --filter @overlay-kit/react-19 run dev
```

## NOTES

- **Playwright required**: `npx playwright install chromium --with-deps` before first test run
- **react-18 vs react-19**: Both actually use React 19 in `package.json` — package names reflect intended compatibility testing
- **Workspace linking**: `overlay-kit` dependency uses `workspace:overlay-kit-async@*` — must build library first (`predev` script handles this)
- **AlertDialogModal `onCancel` prop**: Used in external close demos — allows `openAsync` cancel to resolve with explicit value
