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
}: Props) {
  if (!showGrid) {
    return null
  }

  const lines = []

  // Calculate total grid dimensions
  const totalWidth = gridCellsWidth * gridCellSize
  const totalHeight = gridCellsHeight * gridCellSize

  // Render vertical lines across the entire grid
  for (let x = 0; x <= totalWidth; x += gridCellSize) {
    lines.push(
      <line
        key={`vx-${x}`}
        x1={x}
        y1={0}
        x2={x}
        y2={totalHeight}
        stroke="#e2e2e2"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
    )
  }

  // Render horizontal lines across the entire grid
  for (let y = 0; y <= totalHeight; y += gridCellSize) {
    lines.push(
      <line
        key={`hy-${y}`}
        x1={0}
        y1={y}
        x2={totalWidth}
        y2={y}
        stroke="#e2e2e2"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
    )
  }

  return <>{lines}</>
}
