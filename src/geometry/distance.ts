import type { Point } from '../types/geometry'

/**
 * Calculate the perpendicular distance from a point to a finite line segment.
 * If the closest point on the (infinite) line falls outside the segment, the
 * distance is measured to the nearest endpoint instead.
 */
export function pointToLineSegmentDistance(
    point: Point,
    lineStart: Point,
    lineEnd: Point
): number {
    const A = point.x - lineStart.x
    const B = point.y - lineStart.y
    const C = lineEnd.x - lineStart.x
    const D = lineEnd.y - lineStart.y

    const dot = A * C + B * D
    const lenSq = C * C + D * D

    let param = -1
    if (lenSq !== 0) {
        param = dot / lenSq
    }

    let xx: number
    let yy: number

    if (param < 0) {
        xx = lineStart.x
        yy = lineStart.y
    } else if (param > 1) {
        xx = lineEnd.x
        yy = lineEnd.y
    } else {
        xx = lineStart.x + param * C
        yy = lineStart.y + param * D
    }

    const dx = point.x - xx
    const dy = point.y - yy

    return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Test whether a point lies within `threshold` distance of any segment of a
 * polyline. Each segment's axis-aligned bounding box is expanded by `threshold`
 * before testing, mirroring the legacy behaviour from the editor store.
 */
export function isPointNearPolyline(
    point: Point,
    polyline: Point[],
    threshold = 10
): boolean {
    for (let i = 0; i < polyline.length - 1; i++) {
        const p1 = polyline[i]
        const p2 = polyline[i + 1]

        const dist = pointToLineSegmentDistance(point, p1, p2)
        if (dist > threshold) continue

        const minX = Math.min(p1.x, p2.x) - threshold
        const maxX = Math.max(p1.x, p2.x) + threshold
        const minY = Math.min(p1.y, p2.y) - threshold
        const maxY = Math.max(p1.y, p2.y) + threshold

        if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) {
            return true
        }
    }

    return false
}
