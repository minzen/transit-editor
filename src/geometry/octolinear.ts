import type { Point } from '../types/geometry'

// Helper function to find intersection of two lines
// Given two lines defined by points (p1, p2) and (p3, p4),
// calculates their intersection point using the formula:
// intersection = p1 + t * (p2 - p1)
// where t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom
// and denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x)
export function findLineIntersection(
    p1: Point,
    p2: Point,
    p3: Point,
    p4: Point
): Point | null {
    // Calculate denominator to check if lines are parallel
    const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x)
    if (Math.abs(denom) < 0.0001) {
        // Lines are parallel (or nearly parallel), no intersection
        return null
    }

    // Calculate parameter t for the intersection point on line 1
    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom

    // Calculate the intersection point
    return {
        x: p1.x + t * (p2.x - p1.x),
        y: p1.y + t * (p2.y - p1.y),
    }
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
