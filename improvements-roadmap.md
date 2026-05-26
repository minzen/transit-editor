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

### 3.1 Gesture Event Deduplication on Mobile

**Rationale**: Dual-pointer touch zoom (pinch gestures) sometimes fire synthetic mouse clicks, causing accidental station creation or selection changes on mobile.

**Approach**:
- Strictly call `preventDefault()` on touch events in `useCanvasInteractions.ts`.
- Ensure touch drag thresholds prevent synthetic double-clicks/taps.

---

## Priority 4 — Testing & Visual Quality Assurance (Medium Effort)

### 4.1 Playwright E2E & Visual Regression Suite

**Rationale**: Complex drag-and-drop interactions, octolinear snapping, and SVG rendering are difficult to mock realistically in JSDOM unit tests.

**Approach**:
- Add a lightweight Playwright suite to test real mouse drags on the canvas.
- Introduce visual snapshot testing to verify that canvas rendering matches expected layouts across edits.

