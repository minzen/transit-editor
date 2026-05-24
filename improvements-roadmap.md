# Improvements Roadmap

This document captures the next set of improvements that would push the editor toward producing professional-quality schematic transit maps. The original architectural plan is in `code-review-and-plan.md` (all milestones complete).

Items are ordered by impact-to-effort ratio. Each item lists the rationale, the affected files, and a sketch of the technical approach.

---

## Priority 1 — Visual polish (small effort, high visual impact)

### 1.1 Line endpoints meet the station capsule edge cleanly

**Status**: ✅ Done (commit `d069b94`)

**Problem**: `SegmentLayer` offsets the entire polyline (including endpoints) perpendicular to the segment direction. The station, however, stays at the original centerline. As a result, parallel lines appear to "float" through or beside the capsule rather than terminating cleanly at its edge.

**Approach**:
- For each rendered line in a segment, shorten its first and last vertex along the segment direction by `(capsuleLength / 2)` so the line terminates at the capsule edge.
- For single-line stations (circles), shorten by `STATION_RADIUS` so the stroke just touches the circle.
- Helper: `trimPolyline(points, startTrim, endTrim)` in `src/geometry/`.

**Files**: `src/renderer/SegmentLayer.tsx`, new `src/geometry/trimPolyline.ts`.

### 1.2 Bend point editing (add / remove)

**Status**: ✅ Done (commit `0e92361`)

**Problem**: `BendPointRenderer.tsx` exists with tests, but it is **not** rendered by `EditorCanvas.tsx`. Users cannot add new bend points to an existing segment, nor remove existing ones.

**Approach**:
- Render `BendPointRenderer` inside `EditorCanvas.tsx`, wired to `setDraggingBendPoint` (already exposed by `useCanvasInteractions`).
- Double-click on a segment path inserts a new bend point at the click location (snapped to grid).
- Double-click on a bend point removes it.

**Files**: `src/editor/EditorCanvas.tsx`, `src/renderer/BendPointRenderer.tsx`, `src/store/editorStore.ts` (add `insertBendPoint`, `removeBendPoint`).

---

## Priority 2 — Information density (medium effort, high visual impact)

### 2.1 Line "bullet" badges next to stations

**Status**: ✅ Done (commit `7928bf2`)

**Problem**: Lines are distinguishable only by colour. Real transit maps (NYC subway, Tokyo, Berlin) place small coloured circles or rounded squares with the line code (`6`, `M1`, `A`) next to stations.

**Approach**:
- Add `code: string` to `Line` model (default empty).
- In `StationRenderer`, render a small coloured pill per connected line beside the capsule/circle, with white text containing `line.code`.

**Files**: `src/model/line.ts`, `src/renderer/StationRenderer.tsx`, `src/editor/LineCreator.tsx` (input for code).

### 2.2 Configurable station label placement

**Status**: Pending

**Problem**: Station name text is hard-coded above the station (`y - 12`). Dense parts of a map quickly produce overlapping labels.

**Approach**:
- Add `labelPosition: 'top' | 'bottom' | 'left' | 'right'` to `Station` model.
- `StationRenderer` computes anchor and offset from `labelPosition` and capsule/circle dimensions.
- Optionally add `labelAngle` for rotated labels.

**Files**: `src/model/station.ts`, `src/renderer/StationRenderer.tsx`, UI control in inspector / context menu.

---

## Priority 3 — Map richness (medium-large effort)

### 3.1 Line styles and transit modes

**Status**: Pending

**Approach**: Add `lineStyle: 'solid' | 'dashed' | 'double'` and `transitMode: 'metro' | 'rail' | 'tram' | 'bus' | 'ferry'` to `Line`. Render dashed/double strokes accordingly.

### 3.2 Background geographic features

**Status**: Done

**Approach**: New "shape" tool to draw filled polygons (water, parks). Persist as a shapes layer rendered below segments.

### 3.3 Selection and hover affordances

**Status**: ✅ Done (commit `b331f84`)

**Approach**:
- Multi-select stations (shift+click).
- Hover highlight on segments with tooltip listing connected lines.
- Selecting a line in the toolbar dims everything else.

---

## Priority 4 — Specialist features

### 4.1 Fare / tariff zones overlay
### 4.2 Accessibility & service icons (♿, ⛴, 🚂)

---

## Priority 5 — Technical debt

### 5.1 Replace remaining `||` defaults with `??`

**Status**: ✅ Done

### 5.2 Split `editorStore.ts` into slices

The store is ~625 lines. Splitting into slices (stations, lines, viewport, history) would improve discoverability.

### 5.3 Versioned persisted storage

Adding new fields to `Station`, `Segment`, or `Line` will silently corrupt users' `localStorage`. Add `version` + `migrate` in the Zustand `persist` config so future migrations are safe.

---

## Tracking

Use this section to record commit hashes when items are completed:

| Item | Status | Commit |
|---|---|---|
| 1.1 Line endpoint trimming | ✅ Done | `d069b94` |
| 1.2 Bend point editing | ✅ Done | `0e92361` |
| 2.1 Line bullet badges | ✅ Done | `7928bf2` |
| 2.2 Configurable label placement | ✅ Done | `24215e5` |
| 3.1 Line styles / transit modes | ✅ Done | `8834b2e` |
| 3.2 Background features | ✅ Done | `dbebec5` |
| 3.3 Selection/hover | ✅ Done | `b331f84` |
| 4.1 Fare zones | ✅ Done | — |
| 4.2 Service icons | ✅ Done | — |
| 5.1 `??` lint fixes | ✅ Done | `19eda87` |
| 5.2 Store slices | ✅ Done | `4c77220` |
| 5.3 Versioned persistence | ✅ Done | — |
