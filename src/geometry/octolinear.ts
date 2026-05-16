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

export function isOctolinear(
  origin: Point,
  target: Point
) {
  const snapped = snapPointToOctolinear(origin, target)
  const distance = Math.hypot(
    target.x - origin.x,
    target.y - origin.y
  )

  if (distance === 0) {
    return true
  }

  const deviation = Math.hypot(
    snapped.x - target.x,
    snapped.y - target.y
  )

  return deviation / distance < 0.05
}

export function createOctolinearPath(
  from: Point,
  to: Point
): Point[] {
  if (isOctolinear(from, to)) {
    return [from, to]
  }

  return [
    from,
    {
      x: to.x,
      y: from.y,
    },
    to,
  ]
}
