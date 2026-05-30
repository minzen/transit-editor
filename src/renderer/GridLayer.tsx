type Props = {
  gridCellSize: number
  gridCellsWidth: number
  gridCellsHeight: number
  showGrid?: boolean
  zoom?: number
  offsetX?: number
  offsetY?: number
  themeMode?: 'light' | 'dark'
}

export function GridLayer({
  gridCellSize,
  gridCellsWidth,
  gridCellsHeight,
  showGrid = true,
  themeMode = 'light',
}: Props) {
  if (!showGrid) {
    return null
  }

  const lines = []
  const gridColor = themeMode === 'dark' ? '#3a3a4a' : '#e2e2e2'

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
        stroke={gridColor}
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
        stroke={gridColor}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
    )
  }

  return <>{lines}</>
}
