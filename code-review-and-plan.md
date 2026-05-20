# Code Review & Improvement Plan

This document provides a comprehensive review of the current Transit Map Editor codebase and outlines a strategic plan for structural, visual, and architectural improvements.

**Status**: All milestones completed.

| Milestone | Status | Commit |
|---|---|---|
| 1.1 Vertex offset algorithm | ✅ Done | `5a38e1a` |
| 1.2 Pill/capsule transfer stations | ✅ Done | `8b40ee9` |
| 2.1 `useMapExport` + `useEditorKeyboardShortcuts` hooks | ✅ Done | `dcf7809` |
| 2.2 `useCanvasInteractions` hook | ✅ Done | `858e031` |
| 2.3 Geometry helpers extracted from store | ✅ Done | `03ab5e5` |
| 3.1 Cursor-centered zoom | ✅ Already in place | — |
| 3.2 Boundary constraints | ✅ Done | `87691ea` |

---

## 1. Code Review Findings

### A. Component Structure & Architecture
*   **Monolithic Canvas (`EditorCanvas.tsx`)**:
    *   `EditorCanvas.tsx` is currently over 700 lines long and handles multiple responsibilities: mouse/pointer gesture state machine, keyboard shortcut listeners, drag-and-drop state, coordinate calculations, exporting logic (SVG/PNG), and toolbar UI integration.
    *   **Impact**: High cognitive load for developers, difficult to unit test interaction logic, and prone to regression bugs during modifications.
*   **Excellent Modular Renderers**:
    *   Components like `SegmentLayer`, `StationRenderer`, `GridLayer`, and `PreviewLine` are cleanly separated into their own files. This separation of rendering concerns is a great architectural choice.

### B. State Management (`editorStore.ts`)
*   **Solid Zustand Core**:
    *   The use of Zustand is clean and makes excellent use of immutable state updates and state snapshots for undo/redo functionality.
*   **Direct Mutation Concerns**:
    *   The store handles complex geometry logic (e.g., segment splitting and octolinear routing) inline. As the app grows, geometry helpers should be fully decoupled into pure utility files (like `src/geometry/`).

### C. Multi-Line Rendering Challenges
*   **Why SVG `transform="translate(x, y)"` Failed**:
    *   Using simple CSS/SVG transforms to offset parallel lines shifts the entire coordinate space. On multi-segment paths with bends (45° and 90°), a diagonal or single-direction translate causes lines to separate vertically or horizontally, leading to visual disconnection, misalignment, and overlaps at corners.
    *   **Impact**: Parallel lines must be rendered by calculating actual **parallel offset geometries** (shifting each vertex perpendicular to its line segment direction, and calculating the intersection/bisector of adjacent segment offsets at corner joints).

### D. Station Layout & Scalability
*   **Circular Scaling Limitation**:
    *   Simply enlarging the circular station radius `r` when multiple lines share it causes the station to swallow nearby grid elements and look visually heavy.
    *   **Standard Transit Map Practice**: Transfer stations with multiple lines are typically rendered as rounded capsules (pill shapes) aligned with the line directions, or hollow circles with internal ticks.

---

## 2. Improvement Plan

We propose breaking down the improvements into four key milestones.

```
+-----------------------------------------------------------------------+
|                       1. GEOMETRY & RENDERING                         |
|  - Real perpendicular vertex offset algorithm for parallel lines.    |
|  - Capsule/pill shaped transfer stations aligned to segments.        |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                      2. COMPONENT DECOMPOSITION                       |
|  - Extract pointer hook (`useCanvasInteractions.ts`).                 |
|  - Extract export actions (`useMapExport.ts`).                         |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                    3. GRID & INTERACTION POLISH                       |
|  - Smooth mouse wheel zoom with anchor-to-cursor scaling.             |
|  - Boundary limits on canvas pan/scroll.                              |
+-----------------------------------------------------------------------+
```

### Milestone 1: Parallel Path Geometry & Advanced Station Rendering
1.  **Vertex Offset Algorithm** — ✅ **Done** (commit `5a38e1a`):
    *   Created `src/geometry/offsetPath.ts` (with unit tests in `src/geometry/offsetPath.test.ts`).
    *   Computes perpendicular normals for each segment and uses angle-bisector miter joints between adjacent segments, with a miter limit to prevent extreme stretching at sharp corners.
    *   `SegmentLayer.tsx` calls `offsetPath()` to render each parallel line at distance `(index - (M-1)/2) * spacing` where `spacing = lineWidth + 1.5`.
2.  **Pill/Capsule Transfer Stations** — ✅ **Done** (commit `8b40ee9`):
    *   `StationRenderer.tsx` renders a rounded `<rect>` (capsule) when more than one line connects to a station; single-line stations remain circles.
    *   Capsule length scales with line count: `(lineCount - 1) * spacing + 2 * STATION_RADIUS`.
    *   Capsule rotation = perpendicular to the average segment axis, computed via double-angle averaging so opposite directions add constructively.
    *   Pending and selection rings, plus station name label offsets, scale with the capsule shape.

### Milestone 2: Refactoring & Component Decomposition
1.  **Decompose `EditorCanvas.tsx`** — ✅ **Done** (commits `dcf7809`, `858e031`):
    *   **`useMapExport.ts`**: SVG/PNG export and `showGridForExport` state.
    *   **`useEditorKeyboardShortcuts.ts`**: Space (panning) and Delete/Backspace shortcuts.
    *   **`useCanvasInteractions.ts`**: pointer/wheel/click handlers and interaction state (panning, dragging stations, dragging bend points, `pointerWorldPosition`, drag refs).
    *   `EditorCanvas.tsx` reduced from ~660 to ~338 lines and is now a clean presentation/wiring component.
2.  **Move Geometry to Pure Functions** — ✅ **Done** (commit `03ab5e5`):
    *   Created `src/geometry/distance.ts` with `pointToLineSegmentDistance` and `isPointNearPolyline` (9 unit tests in `distance.test.ts`).
    *   Replaced ~33 lines of inline geometry in `editorStore.ts` with a call to `isPointNearPolyline`. `isPointOnSegment` remains as a thin store wrapper that validates station existence.

### Milestone 3: Grid & Interaction Polish
1.  **Cursor-Centered Zoom** — ✅ **Already in place**:
    *   Wheel zoom in `useCanvasInteractions.ts` already recomputes viewport offsets from the cursor position so the world point under the cursor stays put during zoom.
    *   Toolbar zoom buttons in `EditorCanvas.tsx` zoom around the SVG center, which is the natural anchor when the cursor is on a UI button instead of the canvas.
2.  **Boundary Constraints** — ✅ **Done** (commit `87691ea`):
    *   Added `clampToGridBounds` (clamps points to `[0, worldWidth] × [0, worldHeight]`) and `clampPanOffset` (keeps at least `PAN_VISIBILITY_MARGIN = 100` px of the grid visible) helpers in `useCanvasInteractions.ts`.
    *   Newly placed and dragged stations are clamped to grid bounds.
    *   Pan offset is clamped while panning so the grid cannot be panned completely off-screen.
