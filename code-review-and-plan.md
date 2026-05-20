# Code Review & Improvement Plan

This document provides a comprehensive review of the current Transit Map Editor codebase and outlines a strategic plan for structural, visual, and architectural improvements.

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
1.  **Vertex Offset Algorithm**:
    *   Create a geometry utility `src/geometry/offsetPath.ts` that takes an array of vertices (`Point[]`) and an offset distance `d`.
    *   For each segment between vertices $P_i$ and $P_{i+1}$, calculate the perpendicular normal vector.
    *   Shift each line segment along its normal by distance $d$.
    *   Calculate the intersection points of these shifted adjacent segments to find the new offset bend coordinates (handling the miter joints correctly).
    *   Use this algorithm to generate distinct, neat parallel paths in `SegmentLayer.tsx` that look beautiful at any angle (0°, 45°, 90°).
2.  **Pill/Capsule Transfer Stations**:
    *   In `StationRenderer.tsx`, if `lineCount > 1`, render a dynamic rounded rectangle (capsule) instead of an oversized circle.
    *   Align the capsule rotation angle with the average angle of the connected segments.

### Milestone 2: Refactoring & Component Decomposition
1.  **Decompose `EditorCanvas.tsx`**:
    *   **`useCanvasInteractions.ts`**: Move all mouse down, move, up, wheel, and drag-and-drop state machines into a custom hook.
    *   **`useMapExport.ts`**: Extract SVG processing and PNG generation helpers.
    *   Keep `EditorCanvas.tsx` as a clean presentation layout component that wires the canvas layers, toolbar, and interactions together.
2.  **Move Geometry to Pure Functions**:
    *   Relocate any remaining pathing and snapping geometry logic from `editorStore.ts` into `src/geometry/`.

### Milestone 3: Grid & Interaction Polish
1.  **Cursor-Centered Zoom**:
    *   Improve the zoom function to recalculate viewport offsets based on the current screen cursor position, preventing the canvas from jumping wildly during zoom operations.
2.  **Boundary Constraints**:
    *   Add bounding boxes to panning and station placements to prevent users from dragging elements infinitely into empty space.
