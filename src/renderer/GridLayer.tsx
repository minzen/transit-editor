type Props = {
  width: number
  height: number
  gridSize: number
  showGrid?: boolean
  zoom?: number
  offsetX?: number
  offsetY?: number
}

export function GridLayer({
  width,
  height,
  gridSize,
  showGrid = true,
  zoom = 1,
  offsetX = 0,
  offsetY = 0,
}: Props) {
  if (!showGrid) {
    return null
  }

  const lines = []

  // Calculate the visible area in world coordinates
  const startX = Math.floor((-offsetX / zoom) / gridSize) * gridSize
  const startY = Math.floor((-offsetY / zoom) / gridSize) * gridSize
  const endX = Math.ceil((width - offsetX) / zoom / gridSize) * gridSize + gridSize
  const endY = Math.ceil((height - offsetY) / zoom / gridSize) * gridSize + gridSize

  for (let x = startX; x < endX; x += gridSize) {
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

  for (let y = startY; y < endY; y += gridSize) {
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
