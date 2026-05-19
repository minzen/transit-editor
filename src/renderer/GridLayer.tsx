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

  // Clamp to grid bounds
  const clampedStartX = Math.max(0, startX)
  const clampedStartY = Math.max(0, startY)
  const clampedEndX = Math.min(totalWidth, endX)
  const clampedEndY = Math.min(totalHeight, endY)

  for (let x = clampedStartX; x < clampedEndX; x += gridCellSize) {
    lines.push(
      <line
        key={`vx-${x}`}
        x1={x}
        y1={clampedStartY}
        x2={x}
        y2={clampedEndY}
        stroke="#e2e2e2"
        strokeWidth={1 / zoom}
      />
    )
  }

  for (let y = clampedStartY; y < clampedEndY; y += gridCellSize) {
    lines.push(
      <line
        key={`hy-${y}`}
        x1={clampedStartX}
        y1={y}
        x2={clampedEndX}
        y2={y}
        stroke="#e2e2e2"
        strokeWidth={1 / zoom}
      />
    )
  }

  return <>{lines}</>
}
