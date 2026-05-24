# Transit Map Editor

A browser-based reactive editor for schematic transit maps.

## Features

### Core Editing
- **Station creation and movement** - Add stations to the map and move them with your mouse
- **Station deletion** - Select stations and delete them with Delete or Backspace key
- **Multi-select stations** - Hold Shift and click to select multiple stations at once; Delete removes all selected
- **Station renaming** - Double-click a station to rename it, or right-click for a context menu
- **Station label placement** - Right-click a station to choose label position: top, bottom, left, or right
- **Capsule and circle stations** - Stations automatically render as capsules when connected to multiple lines, circles otherwise
- **Line code badges** - Small coloured pills with line codes (e.g. "M1", "A") appear next to stations

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

### Geographic Shapes
- **Shape tool** - Draw filled polygon shapes (e.g. water, parks, land masses) directly on the map
- **Shape editing** - Click a finished shape to select it, then drag white vertex handles to reposition points
- **Shape deletion** - Select a shape and press Delete or Backspace to remove it
- **Backspace during drawing** - While drawing a shape, press Backspace or Delete to undo the last placed point

### View and Export
- **Custom colors** - Choose from a color palette or enter custom hex codes
- **Undo/Redo** - Undo and redo changes with Ctrl+Z / Ctrl+Y
- **Export** - Export maps in SVG or PNG format (compatible with external editors like Gimp and Inkscape)
- **Background image** - Load a background image onto the map (e.g., city map)
- **Adjustable grid** - Change grid size for more precise placement
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

- **Station** - `{ id, x, y, name?, labelPosition? }`
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
│   ├── useCanvasInteractions.ts
│   ├── useEditorKeyboardShortcuts.ts
│   └── useMapExport.ts
├── store/                     # Zustand store with undo/redo and persistence
│   ├── editorStore.ts
│   └── editorStore.test.ts
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

```bash
npm run test
```

## Docker Containerization

The project includes Dockerfile and docker-compose.yml for easy containerization.

### Build Docker Image

```bash
docker-compose build
```

### Start Containers

```bash
docker-compose up
```

The editor will be available at `http://localhost:80`

## Deploy to VPS

The project includes a deploy.sh script for SSH-based deployment.

### Configuration

Create a `.env` file in the project root (copy from `.env.example`):

```bash
VPS_USER=your_username
VPS_HOST=your_vps_ip_or_domain
VPS_PATH=/opt/transit-editor
```

The `.env` file is included in `.gitignore` to protect sensitive credentials.

### Deploy

```bash
chmod +x deploy.sh
./deploy.sh
```

The script will:
1. Load environment variables from `.env` file
2. Copy files to VPS (rsync)
3. Build Docker image on VPS
4. Restart containers

### Node Version

The project requires Node 24. Ensure the correct version:

```bash
nvm use  # Reads .nvmrc file
```

## Technologies

- React 19
- TypeScript
- Vite 8
- Zustand
- React Router
- Vitest
- React Testing Library
- SVG
- Docker
- Nginx (in production)

## License

MIT
