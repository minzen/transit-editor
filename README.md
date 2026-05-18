# Transit Map Editor

A browser-based reactive editor for schematic transit maps.

## Features

- **Station creation and movement** - Add stations to the map and move them with your mouse
- **Station deletion** - Select stations and delete them with Delete or Backspace key
- **Segment creation** - Create connections between stations in octolinear style (45° and 90° angles)
- **Octolinear snapping** - Stations and bend points snap to octolinear angles (0°, 45°, 90°, 135°, 180°, etc.)
- **Multiple lines** - Create multiple lines with different colors
- **Undo/Redo** - Undo and redo changes
- **Export** - Export maps in SVG or PNG format (compatible with external editors like Gimp and Inkscape)
- **Background image** - Load a background image onto the map (e.g., city map)
- **Adjustable grid** - Change grid size for more precise placement
- **Adjustable line width** - Customize line thickness (1-20 pixels)
- **Zoom controls** - Zoom in, zoom out, and reset view with toolbar buttons or mouse wheel (zoom centers on current view)
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

- **Station** - `{ id, x, y, name? }`
- **Segment** - `{ id, fromStationId, toStationId, lineId, color, points[] }`
- **Line** - `{ id, name, color }`
- **Point** - `{ x, y }` (shared type)

### File Structure

```
src/
├── editor/           # Editor UI components
│   ├── EditorCanvas.tsx
│   ├── EditorToolbar.tsx
│   ├── LineCreator.tsx
│   ├── BackgroundImageControl.tsx
│   ├── GridSizeControl.tsx
│   ├── LineWidthControl.tsx
│   └── HelpDialog.tsx
├── store/            # Zustand store
│   ├── editorStore.ts
│   └── editorStore.test.ts
├── model/            # Data models
│   ├── station.ts
│   ├── segment.ts
│   └── line.ts
├── geometry/         # Geometry functions
│   ├── snap.ts
│   ├── snap.test.ts
│   ├── octolinear.ts
│   └── octolinear.test.ts
├── viewport/         # Viewport coordinates
│   ├── coordinates.ts
│   └── coordinates.test.ts
├── renderer/         # SVG rendering layers
│   ├── GridLayer.tsx
│   └── SegmentLayer.tsx
├── utils/            # Utility functions
│   └── svgExport.ts
├── validation/       # Input validation and sanitization
│   ├── constants.ts
│   └── constants.test.ts
├── types/            # Shared types
│   └── geometry.ts
├── App.tsx           # Main app with routing
└── LandingPage.tsx   # Landing page component
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

- React 18
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
