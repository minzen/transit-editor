# Improvements Roadmap

This document captures the next set of architectural, performance, and interaction improvements to push the editor toward an exceptionally performant, production-ready application. All previous milestones (layout rendering, geometry trimming, and basic interaction) have been successfully completed.

---

## Priority 1 — Performance & React Render Optimization (High Impact, Medium Effort)

### 1.1 Transient Viewport Updates (Render-less Pan & Zoom) — [COMPLETED]

**Rationale**: Viewport pan/zoom changes are extremely high-frequency. Subscribing to `viewport` triggers full-tree React re-renders on every wheel event or pointer move, creating noticeable lag on dense maps.

**Approach**:
- Decouple high-frequency transformations from React state cycles.
- Use a React `ref` pointing to the main SVG `<g class="viewport-layer">`.
- Subscribe to viewport changes transiently via `useEditorStore.subscribe` and apply the SVG transform string directly to the DOM element (`transform="translate(x, y) scale(z)"`), bypassing React rendering passes completely.

### 1.2 Fine-Grained Zustand Selectors — [COMPLETED]

**Rationale**: `useCanvasInteractions.ts` and major rendering layers subscribe to broad store slices. A change in a single station's name or color causes everything else to recalculate.

**Approach**:
- Refactor hooks and layers to select only the exact primitive values they need (e.g. `useEditorStore((s) => s.stations[id].x)`).
- Memoize expensive layout calculations (like offset path vertices and capsule alignment angles).

---

## Priority 2 — Architecture & Scalability (Medium-Large Effort)

### 2.1 Action-Based Delta History (Undo/Redo optimization) — [COMPLETED]

**Rationale**: Currently, every action takes a full state snapshot (`createSnapshot`). This is simple but doesn't scale as maps grow to hundreds of elements, leading to massive memory usage.

**Approach**:
- Move from complete state snapshotting to an **action-based delta history** (Command pattern) or integrate Zustand's `zundo` middleware.
- Only record the specific entities modified in each step to minimize memory footprint.

### 2.2 Versioned Persisted Storage Migrations — [COMPLETED]

**Rationale**: Adding new properties to lines or stations (such as label positions or services) can corrupt or mismatch older versions of maps stored in users' local storage.

**Approach**:
- Add a `version` number to the Zustand storage configuration.
- Implement a `migrate` callback in Zustand's persist options to automatically upgrade old map schemas safely.

---

## Priority 3 — Polish & Mobile Enhancements (Medium Effort)

### 3.1 Gesture Event Deduplication on Mobile — [COMPLETED]

**Rationale**: Dual-pointer touch zoom (pinch gestures) sometimes fire synthetic mouse clicks, causing accidental station creation or selection changes on mobile.

**Approach**:
- Strictly call `preventDefault()` on touch events in `useCanvasInteractions.ts`.
- Ensure touch drag thresholds prevent synthetic double-clicks/taps.

### 3.2 Background Image Import & Controls — [COMPLETED]

**Rationale**: The editor already supports loading a background image, but lacked controls for placement, sizing, opacity, and removal.

**Implementation**:
- Moved background image state from local `useState` in `EditorCanvas.tsx` to `ViewSlice` in the Zustand store
- Added controls in `BackgroundImageControl.tsx`: Load Image, Show/Hide, Remove
- Added sliders for X/Y placement, Width, Height, and Opacity
- Updated `EditorCanvas.tsx` to render the SVG `<image>` with dynamic properties from store
- Removed prop drilling through `EditorToolbar.tsx`
- i18n strings added for EN and DE
- Tests updated in `src/editor/BackgroundImageControl.test.tsx`

---

## Priority 4 — Testing & Visual Quality Assurance (Medium Effort)

### 4.1 Playwright E2E & Visual Regression Suite — [COMPLETED]

**Rationale**: Complex drag-and-drop interactions, octolinear snapping, and SVG rendering are difficult to mock realistically in JSDOM unit tests.

**Approach**:
- Add a lightweight Playwright suite to test real mouse drags on the canvas.
- Introduce visual snapshot testing to verify that canvas rendering matches expected layouts across edits.

**Implementation Notes**:
- Playwright configured in `playwright.config.ts` with auto-started dev server on `http://localhost:5173` and a `Desktop Chrome` (1280×800) project.
- Smoke E2E suite in `e2e/smoke.spec.ts` covers: landing page navigation, station creation via canvas, line creation dialog, zoom/reset toolbar buttons, and undo enablement.
- Visual regression suite in `e2e/visual.spec.ts` captures the landing page, empty editor, and editor with a single station; baselines are stored under `e2e/visual.spec.ts-snapshots/`.
- npm scripts: `e2e`, `e2e:ui`, `e2e:update-snapshots`, `e2e:report`.
- `data-testid="editor-canvas"` added to the main SVG to give tests a stable canvas selector.

---

# Next Iteration — Proposed Improvements

## Priority 5 — Accessibility & Keyboard Navigation (Medium Effort)

### 5.1 Canvas Keyboard Navigation ✅

**Rationale**: The editor is currently mouse/touch only. Keyboard-only users cannot create or select stations, segments, or shapes, which blocks accessibility compliance.

**Implementation**:
- `src/editor/useCanvasKeyboardNavigation.ts`: hook managing keyboard cursor, arrow-key movement, Tab cycling, Enter tool activation, Escape clearing
- SVG canvas is focusable (`tabIndex={0}`) with `role="application"` and `aria-label`
- Focus ring styled in `EditorCanvas.css`
- Arrow keys move selected stations/shapes by `gridCellSize` (Shift = 10×)
- Tab cycles stations in spatial reading order (top-to-bottom, left-to-right)
- Enter activates current tool at keyboard cursor: add station (station tool), start/complete segment (segment tool), add shape point / close shape with Shift+Enter (shape tool), select nearest station/shape (select tool)
- Escape clears all selections (stations, shapes, shape points)
- Keyboard cursor rendered as crosshair inside the viewport layer, counter-scaled to stay constant size at all zoom levels
- 14 unit tests in `src/editor/useCanvasKeyboardNavigation.test.tsx`

### 5.2 ARIA Labels and Screen Reader Support ✅

**Rationale**: IconButtons rely on Tooltip `title` attributes and the SVG canvas exposes no semantics to assistive tech.

**Implementation**:
- Added explicit `aria-label` to all `IconButton`s in `EditorToolbar.tsx` and `LineCreator.tsx`
- Canvas already has `role="application"` and `aria-label="Transit map canvas"` from 5.1
- Created `src/store/slices/accessibilitySlice.ts` with `announcement`, `setAnnouncement`, and `clearAnnouncement`
- Added visually hidden `aria-live="polite"` region in `App.tsx` that announces structural changes
- Wired announcements into key data slice actions: `addStation`, `deleteStation`, `addSegment`, `addLine`, `addShape`, `deleteShape`, `undo`, `redo`, `clear`
- 8 unit tests in `src/store/slices/accessibilitySlice.test.ts`

---

## Priority 6 — Layout Intelligence (Large Effort)

### 6.1 Automatic Station Label Placement — [COMPLETED]

**Rationale**: Station labels currently use a single configurable position per station and can collide with neighbouring stations and segments on dense maps.

**Approach**:
- Implement a force-based or heuristic label placer that picks one of the 8 compass positions to minimize overlap with other labels and segments.
- Run the placer on demand (button) and incrementally after `moveStation` for the affected neighbourhood only.

**Implementation Notes**:
- New `src/geometry/labelPlacement.ts` with `chooseBestLabelPositions(stations, segments)`.
- Greedy algorithm scores each of the 4 cardinal positions for every station, penalizing overlap with other stations, existing labels, and nearby segment edges.
- `autoPlaceLabels` action added to `dataSlice.ts` that applies the chosen positions in a single delta history step.
- Toolbar button "Auto-place Labels" wired in both mobile (more menu) and desktop layouts; i18n strings added for EN and DE.

### 6.2 Segment Auto-Routing Suggestions — [COMPLETED]

**Rationale**: Octolinear routing of new segments requires manual bend-point placement to avoid crossings.

**Approach**:
- When creating a segment between two stations, propose a default octolinear path that avoids known obstacles (other stations, shapes).
- Allow the user to accept (Enter) or refine via bend dragging.

**Implementation Notes**:
- New `createSmartOctolinearPath(from, to, obstacles, clearance)` in `src/geometry/octolinear.ts`.
- Evaluates both L-shape orientations (horizontal-then-vertical vs vertical-then-horizontal), counting collisions with obstacle points within `clearance` distance.
- Chooses the orientation with fewer collisions; ties broken by total path length and a stable HV preference.
- `addSegment` in `dataSlice.ts` now passes all other station centres as obstacles, so newly created segments automatically avoid running through unrelated stations.

---

## Priority 7 — Quality & Tooling (Low–Medium Effort)

### 7.1 CI Pipeline for Tests + E2E + Visual — [COMPLETED]

**Rationale**: Tests and visual baselines only run locally; regressions can slip into `develop`/`main`.

**Approach**:
- Add a GitHub Actions workflow that runs `lint`, `test`, `build`, and `e2e` (with cached Playwright browsers) on every PR.
- Upload the Playwright HTML report and any diff images as artifacts on failure.
- Optionally gate merges on a green pipeline.

**Implementation Notes**:
- New `.github/workflows/ci.yml` with 7 jobs orchestrated via `needs`:
  - `lint-test-build`: lint → test → build
  - `e2e`: depends on lint-test-build; installs Playwright browsers with deps; runs smoke + visual regression; uploads report + diffs on failure
  - `status`: posts `ci/all` commit status; blocks merge on failure
  - `report-pr-comment`: updates PR with CI results table
  - `deploy-preview`: uploads build artifact on green PRs
  - `deploy-production`: deploys to VPS (`ghast.feetunyrhinen.de`) via SSH tar + Docker Compose build/up; creates commit status + auto-releases on main push
  - `notify`: commit statuses for `ci/merge` gate
- Node version read from `.nvmrc`; npm cache enabled.
- Concurrency group cancels in-progress runs for the same branch.
- **Limitation**: Protected-branch required-status-checks enforcement is only available on public repos or GitHub Team/Enterprise. On a free private repo the statuses post but do not mechanically block merges — rely on team discipline until you go public or upgrade.

### 7.2 Performance Benchmark Harness ✅

**Rationale**: Recent perf work (transient viewport, memoization, delta history) has no automated regression guard. Future refactors may silently slow things down.

**Implementation**:
- `src/benchmark/generator.ts`: synthetic 500-station / 50-line map generator
- `src/benchmark/benchmarkStore.ts`: raw Zustand store (no persist) for clean measurements
- `src/benchmark/benchmark.ts`: Vitest benchmark suite measuring pan, zoom, undo, addStation, addSegment as batch totals to amortise GC noise
- `src/benchmark/baselines.json`: baseline per-op timings with 30% regression threshold
- `vitest.benchmark.config.ts`: separate Vitest config so benchmarks don't run with regular tests
- CI: `npm run benchmark` runs in the `lint-test-build` job; regressions fail the build

**Baselines** (ms/op, generous for CI variance):
- pan: 0.050, zoom: 0.065, undo: 0.500, addStation: 2.000, addSegment: 0.500

### 7.3 Map Import/Export Schema with Validation — [COMPLETED]

**Rationale**: Exported JSON has no schema; importing a hand-edited or older file can corrupt state despite the persist migration layer.

**Implementation**:
- Installed `zod` as a dependency
- Created `src/validation/mapSchema.ts` with Zod schemas for `Point`, `Station`, `Segment`, `Line`, `Shape`, and `MapDocument`
- `validateMapDocument()` returns `{ success: true; data: MapDocument } | { success: false; errors: string[] }` with human-readable error paths
- Added `importMap` action to `DataSlice` that bulk-loads stations, segments, lines, shapes and resets history
- Created `src/editor/useMapJSON.ts` hook with `exportAsJSON` and `triggerImport` functions
- Export includes all map data + view settings (viewport, grid, language, etc.)
- Import validates with Zod, applies validated data to store, and surfaces errors via `ImportErrorDialog`
- Added `Export JSON` and `Import JSON` buttons to `EditorToolbar` (both desktop and mobile layouts)
- Created `src/editor/ImportErrorDialog.tsx` to show a list of validation errors
- i18n strings added for EN and DE
- 13 unit tests in `src/validation/mapSchema.test.ts`

---

## Priority 8 — Code Review Follow-ups (Print + Export Hardening)

These items emerged from a code review of commits `6fe952a` → `fa97cd0` (smooth print, export-handle hiding, migration backfill, stale-closure fixes). No blockers, but worth tackling gradually.

### 8.1 Use `afterprint` event for print reset ✅

**Rationale**: `useMapExport.print()` currently resets export flags synchronously after `window.print()`. This is reliable in Chromium/WebKit (which block until the dialog closes) but unreliable in some Firefox versions where `window.print()` is asynchronous. If async, handles can be restored before the print snapshot is taken.

**Approach**:
- Replace the synchronous reset with a one-shot `afterprint` listener:
  ```ts
  const handler = () => {
      resetExportFlags()
      window.removeEventListener('afterprint', handler)
  }
  window.addEventListener('afterprint', handler)
  window.print()
  ```
- Also handles the "Cancel" button correctly across browsers.

### 8.2 Unify re-render-wait strategy in `useMapExport` ✅

**Rationale**: `print()` uses a single `requestAnimationFrame`; `exportAsSVG`/`exportAsPNG` use `setTimeout(..., 0)`. A single `rAF` fires before the next paint and may not guarantee that React has flushed the state update that hides handles. Inconsistency also makes the code harder to reason about.

**Approach**:
- Pick one strategy across all three exports: either double `rAF` (`requestAnimationFrame(() => requestAnimationFrame(...))`) or `setTimeout(..., 0)`.
- Extract a helper `waitForRender(): Promise<void>` and `await` it in each export function.

### 8.3 Replace fragile print CSS selector ✅

**Rationale**: The print stylesheet uses `.editor-canvas > div:not(:has(svg)) { display: none !important }` to hide tooltip and context-menu overlays. This rule is brittle: any future direct child `<div>` of `.editor-canvas` that doesn't contain an SVG will be hidden, and `:has()` requires Safari 15.4+ / Firefox 121+.

**Approach**:
- Replace the structural selector with explicit class names (e.g. `.segment-tooltip, .context-menu, .station-rename-popover`).
- Audit all overlay components rendered inside `.editor-canvas` and ensure they have stable class hooks for print suppression.

### 8.4 Reconsider `@page { margin: 0 }`

**Rationale**: `EditorCanvas.css` sets the printed page margin to zero. This removes browser headers/footers but also forces map content to the physical paper edge, which most printers cannot reach — output may be clipped.

**Approach**:
- Change to `@page { margin: 1cm; size: auto }` (or `0.5in`) as a safer default.
- Optionally expose a "Tight margins" toggle in the print path for users who want edge-to-edge.

### 8.5 Update `useMapExport` docstring

**Rationale**: The header comment still describes the hook as "providing SVG and PNG export"; it doesn't mention `print()` or the new `showInteractiveHandlesForExport` flag.

**Approach**:
- Refresh the JSDoc to reflect the three export modes and the trio of visibility flags.

### 8.6 Regression test for Space+Delete race

**Rationale**: Commit `6fe952a` fixed a stale-closure bug where rapid Space+Delete presses could still trigger deletion. The fix uses a ref, but there's no automated test guarding against regression.

**Approach**:
- Add a unit test for `useEditorKeyboardShortcuts` that synchronously dispatches `keydown` for Space immediately followed by Delete and asserts `onDeleteSelected` is **not** called.
- Use `@testing-library/react`'s `renderHook` and `window.dispatchEvent(new KeyboardEvent(...))`.

### 8.7 Integration test for export-handle hiding

**Rationale**: Commit `503d092` introduced `showInteractiveHandlesForExport` to keep bend points and shape vertices out of exported SVG/PNG/print output. There's no test asserting this stays false during the export window.

**Approach**:
- Add a unit test that calls `exportAsSVG()` and asserts `showInteractiveHandlesForExport === false` synchronously after the call (before the timeout fires).
- Optionally extend a Playwright test to download an SVG and grep for handle classes.
