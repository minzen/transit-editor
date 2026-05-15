type Props = {
  width: number
  height: number
  gridSize: number
}

export function GridLayer({
  width,
  height,
  gridSize,
}: Props) {
  const lines = []

  for (let x = 0; x < width; x += gridSize) {
    lines.push(
      <line
        key={`vx-${x}`}
        x1={x}
        y1={0}
        x2={x}
        y2={height}
        stroke="#e2e2e2"
        strokeWidth={1}
      />
    )
  }

  for (let y = 0; y < height; y += gridSize) {
    lines.push(
      <line
        key={`hy-${y}`}
        x1={0}
        y1={y}
        x2={width}
        y2={y}
        stroke="#e2e2e2"
        strokeWidth={1}
      />
    )
  }

  return <>{lines}</>
}
