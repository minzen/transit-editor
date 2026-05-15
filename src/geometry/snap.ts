export function snapToGrid(
  value: number,
  gridSize: number
) {
  return (
    Math.round(value / gridSize) * gridSize
  )
}

export function snapPointToGrid(
  x: number,
  y: number,
  gridSize: number
) {
  return {
    x: snapToGrid(x, gridSize),
    y: snapToGrid(y, gridSize),
  }
}
