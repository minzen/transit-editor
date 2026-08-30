# Transit Map Editor

A browser-based reactive editor for schematic transit maps.

## Continuing work on another computer

Project handoff information is kept in version control:

- [`STATE.md`](STATE.md) records the current focus, blockers, next step, and verification status.
- [`TODO.md`](TODO.md) records work in progress and the prioritized backlog.
- [`DECISIONS.md`](DECISIONS.md) records durable decisions and their rationale.

Update these files with the related work, commit and push the branch on the first computer, then pull it on the other. Uncommitted changes and browser `localStorage` do not synchronize through Git.

## Features

### Core Editing
- **Station creation and movement** - Add stations to the map and move them with the mouse or arrow keys
- **Station deletion** - Select stations or shapes and delete them with Delete or Backspace
- **Multi-select and Select All** - Hold Shift and click stations to select multiple; use Ctrl+A or Cmd+A to select all stations and shapes, then drag or use arrow keys to move the selection
- **Station renaming** - Double-click a station to rename it, or right-click for a context menu
- **Station label placement** - Right-click a station to choose label position: top, bottom, left, or right
- **Station label rotation** - Right-click a station to rotate its label to avoid collisions and improve readability
- **Capsule and circle stations** - Stations automatically render as capsules when connected to multiple lines, circles otherwise
- **Service icons** - Tag stations with service icons (accessibility, ferry, rail, airport, toilet)
- **Line code badges** - Small coloured pills with line codes (e.g. "M1", "A") appear next to stations and can be shown or hidden

### Segments and Lines
- **Segment creation** - Create connections between stations in octolinear style (45° and 90° angles)
- **Octolinear snapping** - Stations and bend points snap to octolinear angles
- **Bend point editing** - Double-click a segment path to add a bend point; double-click a bend point to remove it. Drag bend points to adjust the route
- **Multiple lines** - Create multiple lines with different colors
- **Line styles** - Choose solid, dashed, or double stroke per line
- **Transit modes** - Tag lines as metro, rail, tram, bus, or ferry
- **Line codes** - Assign short codes (e.g. "U1", "S-Bahn") to lines for badge rendering
- **Line dimming** - Selecting a line in the toolbar dims unrelated stations and segments for easier tracing
- **Segment hover tooltip** - Hover over a segment to see which lines it belongs to
- **Line corridor offset** - Multiple lines sharing a segment are drawn side-by-side with automatic offset

### Geographic Shapes
- **Shape tool** - Draw filled polygon shapes (e.g. water, parks, land masses) directly on the map
- **Shape editing** - Click a finished shape to select it, then drag white vertex handles to reposition points
- **Shape deletion** - Select a shape and press Delete or Backspace to remove it
- **Backspace during drawing** - While drawing a shape, press Backspace or Delete to undo the last placed point

### View and Export
- **Custom colors** - Choose from a color palette or enter custom hex codes
- **Undo/Redo** - Undo and redo changes with Ctrl+Z / Ctrl+Y
- **Theme toggle** - Switch between light and dark mode; preference is saved across sessions
- **i18n** - Interface available in English and German
- **Canvas background** - Choose a custom canvas background colour or follow the active theme
- **Auto-place labels** - Position station labels automatically
- **Export** - Export maps in SVG or PNG format (compatible with external editors like Gimp and Inkscape)
- **Print** - Print the map directly from the browser; interactive handles are hidden automatically
- **Import/Export JSON** - Save and load complete map data as JSON for backup or sharing
- **Background image** - Load a background image onto the map (e.g., city map)
- **Adjustable grid** - Set the map width and height in grid cells
- **Adjustable line width** - Customize line thickness (1-20 pixels)
- **Zoom controls** - Zoom in, zoom out, and reset view with toolbar buttons or mouse wheel
- **Panning** - Hold Space and drag to pan the canvas, or use the middle mouse button
- **Auto-save** - Editor state automatically saved to browser localStorage
- **Input validation** - Line and station names are validated and sanitized for security

## Architecture

The project uses the following architecture:

- **React + TypeScript + Vite** - Modern React stack with type safety
- **Zustand** - State management for editor state (stations, segments, lines, undo/redo)
- **Zustand persist middleware** - Automatic localStorage persistence for editor state
- **React Router** - Client-side routing between landing page and editor
- **SVG rendering** - Map is rendered in SVG with viewport transform
- **World coordinates** - All data is stored in world coordinates, not screen coordinates
- **Viewport management** - Zoom and pan functionality with viewport state
- **Octolinear snapping** - Segment points snap to 45° and 90° angles
- **Component separation** - UI is split into smaller reusable components
- **Input validation** - Sanitization and validation for user inputs

### Data Models

- **Station** - `{ id, x, y, name?, labelPosition?, labelRotation?, services?, fareZone? }`
- **Segment** - `{ id, fromStationId, toStationId, lineIds[], points[] }`
- **Line** - `{ id, name, color, lineStyle?, transitMode?, code? }`
- **Shape** - `{ id, points[], color, name?, opacity? }`
- **Point** - `{ x, y }` (shared type)

### File Structure

```
src/
├── editor/                    # Editor UI components and hooks
│   ├── EditorCanvas.tsx
│   ├── EditorToolbar.tsx
│   ├── LineCreator.tsx
│   ├── BackgroundImageControl.tsx
│   ├── GridSizeControl.tsx
│   ├── LineWidthControl.tsx
│   ├── HelpDialog.tsx
│   ├── RenameDialog.tsx
│   ├── ConfirmDialog.tsx
│   ├── ImportErrorDialog.tsx
│   ├── useCanvasInteractions.ts
│   ├── useEditorKeyboardShortcuts.ts
│   ├── useMapExport.ts
│   └── useMapJSON.ts
├── store/                     # Zustand store with undo/redo and persistence
│   ├── editorStore.ts
│   ├── editorStore.test.ts
│   └── slices/
│       ├── viewSlice.ts
│       └── dataSlice.ts
├── i18n/                      # Internationalisation (EN / DE)
│   ├── i18n.ts
│   └── locales/
│       ├── en.json
│       └── de.json
├── model/                     # Data models
│   ├── station.ts
│   ├── segment.ts
│   ├── line.ts
│   └── shape.ts
├── geometry/                  # Geometry and snapping functions
│   ├── snap.ts
│   ├── octolinear.ts
│   ├── trimPolyline.ts
│   ├── offsetPath.ts
│   ├── distance.ts
│   └── *.test.ts
├── viewport/                  # Viewport coordinate transforms
│   ├── coordinates.ts
│   └── coordinates.test.ts
├── renderer/                  # SVG rendering layers
│   ├── GridLayer.tsx
│   ├── SegmentLayer.tsx
│   ├── StationRenderer.tsx
│   ├── BendPointRenderer.tsx
│   ├── ShapeLayer.tsx
│   └── PreviewLine.tsx
├── utils/                     # Utility functions
│   ├── svgExport.ts
│   └── stationUtils.ts
├── validation/                # Input validation and sanitization
│   ├── constants.ts
│   └── constants.test.ts
├── types/                     # Shared types
│   └── geometry.ts
├── App.tsx                    # Main app with routing
└── LandingPage.tsx            # Landing page component
```

## Development

### Installation

```bash
npm install
```

### Build

```bash
npm run build
```

### Development Server

```bash
npm run dev
```

The editor will be available at `http://localhost:5173`

### Tests

Run unit tests with Vitest:

```bash
npm run test
```

Run unit tests with the enforced coverage thresholds:

```bash
npm test -- --coverage
```

### End-to-End and Visual Regression Tests

The project uses [Playwright](https://playwright.dev/) for E2E and visual regression tests located in `e2e/`.

Install browser binaries (first time only):

```bash
npx playwright install chromium
```

Run all E2E tests headless against an auto-started dev server:

```bash
npm run e2e
```

Open the interactive UI runner:

```bash
npm run e2e:ui
```

Update visual snapshot baselines after intentional UI changes:

```bash
npm run e2e:update-snapshots
```

View the last HTML report:

```bash
npm run e2e:report
```

Snapshots are stored next to their spec files under `e2e/*.spec.ts-snapshots/` and are committed to the repository. The `playwright-report/` and `test-results/` folders are git-ignored.

## Deployment and analytics

Docker, VPS deployment, Node version, and optional Plausible Analytics configuration are documented in [the deployment guide](docs/deployment.md).

## Technologies

- React 19
- TypeScript
- Vite 8
- Zustand
- React Router
- MUI (Material-UI)
- i18next
- Vitest
- React Testing Library
- Playwright (E2E + visual regression)
- SVG
- Docker
- Nginx (in production)

## License

MIT
