import type { Point } from '../types/geometry'

/**
 * Offsets a polyline (array of points) perpendicularly by a distance d.
 * Handles corners by calculating the miter joints (using the angle bisector).
 * 
 * @param points - The original polyline vertices
 * @param d - The offset distance in pixels (positive for one side, negative for the other)
 * @returns The offset polyline points
 */
export function offsetPath(points: Point[], d: number): Point[] {
    if (points.length < 2 || d === 0) {
        return points.map(p => ({ ...p }))
    }

    const result: Point[] = []
    const n = points.length

    // Helper to get normalized normal vector of segment (p1 -> p2)
    // Rotated 90 degrees clockwise: dx, dy -> -dy, dx
    const getSegmentNormal = (p1: Point, p2: Point): Point => {
        const dx = p2.x - p1.x
        const dy = p2.y - p1.y
        const len = Math.sqrt(dx * dx + dy * dy)
        if (len === 0) return { x: 0, y: 0 }
        return { x: -dy / len, y: dx / len }
    }

    // Precalculate segment normals
    const normals: Point[] = []
    for (let i = 0; i < n - 1; i++) {
        normals.push(getSegmentNormal(points[i], points[i + 1]))
    }

    // 1. First point offset
    const firstNormal = normals[0]
    result.push({
        x: points[0].x + firstNormal.x * d,
        y: points[0].y + firstNormal.y * d,
    })

    // 2. Middle joints (miter joints with angle bisector)
    for (let i = 1; i < n - 1; i++) {
        const n1 = normals[i - 1]
        const n2 = normals[i]

        // Average normal (angle bisector direction)
        const bisectorX = n1.x + n2.x
        const bisectorY = n1.y + n2.y
        const bisectorLen = Math.sqrt(bisectorX * bisectorX + bisectorY * bisectorY)

        if (bisectorLen < 0.01) {
            // Segments are in opposite directions (degenerate corner)
            // Just offset using the segment normal
            result.push({
                x: points[i].x + n1.x * d,
                y: points[i].y + n1.y * d,
            })
        } else {
            const bx = bisectorX / bisectorLen
            const by = bisectorY / bisectorLen

            // Calculate scaling factor = 1 / cos(half_angle)
            // dot product of normalized bisector and segment normal
            const cosHalfAngle = bx * n1.x + by * n1.y

            // Safeguard division by zero and limit extremely sharp miters
            // Miter limit = 2.5 times the offset distance
            const miterLimit = 2.5
            const scale = cosHalfAngle > 0.1 ? Math.min(miterLimit, 1 / cosHalfAngle) : miterLimit

            result.push({
                x: points[i].x + bx * d * scale,
                y: points[i].y + by * d * scale,
            })
        }
    }

    // 3. Last point offset
    const lastNormal = normals[normals.length - 1]
    result.push({
        x: points[n - 1].x + lastNormal.x * d,
        y: points[n - 1].y + lastNormal.y * d,
    })

    return result
}
