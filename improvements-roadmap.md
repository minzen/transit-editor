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

### 7.3 Map Import/Export Schema with Validation

**Rationale**: Exported JSON has no schema; importing a hand-edited or older file can corrupt state despite the persist migration layer.

**Approach**:
- Define a Zod (or hand-rolled) schema for the exported map document.
- Validate on import; surface a friendly error dialog listing invalid fields instead of crashing the editor.
