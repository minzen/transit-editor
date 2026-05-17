# Transit Map Editor

A browser-based reactive editor for schematic transit maps.

## Features

- **Station creation and movement** - Add stations to the map and move them with your mouse
- **Segment creation** - Create connections between stations in octolinear style (45° and 90° angles)
- **Multiple lines** - Create multiple lines with different colors
- **Undo/Redo** - Undo and redo changes
- **Export** - Export maps in SVG or PNG format
- **Background image** - Load a background image onto the map (e.g., city map)
- **Adjustable grid** - Change grid size for more precise placement

## Architecture

The project uses the following architecture:

- **React + TypeScript + Vite** - Modern React stack with type safety
- **Zustand** - State management for editor state (stations, segments, lines, undo/redo)
- **SVG rendering** - Map is rendered in SVG with viewport transform
- **World coordinates** - All data is stored in world coordinates, not screen coordinates
- **Octolinear snapping** - Segment points snap to 45° and 90° angles
- **Component separation** - UI is split into smaller reusable components

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
│   └── GridSizeControl.tsx
├── store/            # Zustand store
│   └── editorStore.ts
├── model/            # Data models
│   ├── station.ts
│   ├── segment.ts
│   └── line.ts
├── geometry/         # Geometry functions
│   ├── snap.ts
│   └── octolinear.ts
├── viewport/         # Viewport coordinates
│   └── coordinates.ts
├── renderer/         # SVG rendering layers
│   ├── GridLayer.tsx
│   └── SegmentLayer.tsx
└── types/            # Shared types
    └── geometry.ts
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

Edit the `deploy.sh` file and set your VPS details:

```bash
VPS_USER="your_username"
VPS_HOST="your_vps_ip_or_domain"
VPS_PATH="/opt/transit-editor"
```

### Deploy

```bash
chmod +x deploy.sh
./deploy.sh
```

The script will:
1. Copy files to VPS (rsync)
2. Build Docker image on VPS
3. Restart containers

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
- SVG
- Docker
- Nginx (in production)

## License

MIT
