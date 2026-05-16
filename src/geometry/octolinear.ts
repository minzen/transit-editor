export type Point = {
  x: number
  y: number
}

export function snapPointToOctolinear(
  origin: Point,
  target: Point
): Point {
  const dx = target.x - origin.x
  const dy = target.y - origin.y

  if (dx === 0 && dy === 0) {
    return target
  }

  const angle = Math.atan2(dy, dx)
  const step = Math.PI / 4
  const snappedAngle = Math.round(angle / step) * step
  const distance = Math.hypot(dx, dy)

  return {
    x: origin.x + Math.cos(snappedAngle) * distance,
    y: origin.y + Math.sin(snappedAngle) * distance,
  }
}
