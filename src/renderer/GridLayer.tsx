type Props = {
  gridCellSize: number
  gridCellsWidth: number
  gridCellsHeight: number
  showGrid?: boolean
  zoom?: number
  offsetX?: number
  offsetY?: number
}

export function GridLayer({
  gridCellSize,
  gridCellsWidth,
  gridCellsHeight,
  showGrid = true,
  zoom = 1,
  offsetX = 0,
  offsetY = 0,
}: Props) {
  if (!showGrid) {
    return null
  }

  const lines = []

  // Calculate total grid dimensions
  const totalWidth = gridCellsWidth * gridCellSize
  const totalHeight = gridCellsHeight * gridCellSize

  // Calculate the visible area in world coordinates
  const startX = Math.floor((-offsetX / zoom) / gridCellSize) * gridCellSize
  const startY = Math.floor((-offsetY / zoom) / gridCellSize) * gridCellSize
  const endX = Math.ceil((totalWidth - offsetX) / zoom / gridCellSize) * gridCellSize + gridCellSize
  const endY = Math.ceil((totalHeight - offsetY) / zoom / gridCellSize) * gridCellSize + gridCellSize

  for (let x = startX; x < endX; x += gridCellSize) {
    lines.push(
      <line
        key={`vx-${x}`}
        x1={x}
        y1={startY}
        x2={x}
        y2={endY}
        stroke="#e2e2e2"
        strokeWidth={1 / zoom}
      />
    )
  }

  for (let y = startY; y < endY; y += gridCellSize) {
    lines.push(
      <line
        key={`hy-${y}`}
        x1={startX}
        y1={y}
        x2={endX}
        y2={y}
        stroke="#e2e2e2"
        strokeWidth={1 / zoom}
      />
    )
  }

  return <>{lines}</>
}
