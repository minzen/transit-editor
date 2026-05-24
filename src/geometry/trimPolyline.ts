import type { Point } from '../types/geometry'

/**
 * Trim the first and last segments of a polyline by the given pixel amounts
 * along their respective directions. The interior vertices are preserved.
 *
 * If a trim distance exceeds the length of the first/last segment, the segment
 * collapses to the next vertex (i.e. the trimmed endpoint snaps to the next
 * interior vertex).
 *
 * @param points - polyline vertices (must contain at least 2 points)
 * @param startTrim - distance to trim from the start (pixels)
 * @param endTrim - distance to trim from the end (pixels)
 * @returns a new polyline with the same number of points
 */
export function trimPolyline(
    points: Point[],
    startTrim: number,
    endTrim: number
): Point[] {
    if (points.length < 2) {
        return points.map((p) => ({ ...p }))
    }

    const result = points.map((p) => ({ ...p }))

    if (startTrim > 0) {
        const p0 = result[0]
        const p1 = result[1]
        const dx = p1.x - p0.x
        const dy = p1.y - p0.y
        const len = Math.hypot(dx, dy)
        if (len > 0) {
            const t = Math.min(startTrim, len) / len
            result[0] = {
                x: p0.x + dx * t,
                y: p0.y + dy * t,
            }
        }
    }

    if (endTrim > 0) {
        const last = result.length - 1
        const pn = result[last]
        const pm = result[last - 1]
        const dx = pm.x - pn.x
        const dy = pm.y - pn.y
        const len = Math.hypot(dx, dy)
        if (len > 0) {
            const t = Math.min(endTrim, len) / len
            result[last] = {
                x: pn.x + dx * t,
                y: pn.y + dy * t,
            }
        }
    }

    return result
}
