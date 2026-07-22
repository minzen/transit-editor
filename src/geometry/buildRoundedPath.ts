import type { Point } from '../types/geometry'
import { distance as dist, lerp } from './vector'

/**
 * Convert an array of polyline points into an SVG path string with
 * quadratic-Bézier rounded corners at every interior bend point.
 *
 * @param points    Ordered polyline vertices (must have at least 2 points)
 * @param radius    Desired corner radius in world units. Defaults to 12.
 *                  The actual radius at each corner is clamped so that
 *                  the rounded portion never exceeds half the length of
 *                  the adjacent segments.
 */
export function buildRoundedPolylinePath(points: Point[], radius = 12): string {
    if (points.length === 0) return ''
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
    if (points.length === 2) {
        return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
    }

    let d = `M ${points[0].x} ${points[0].y}`

    for (let i = 1; i < points.length - 1; i++) {
        const prev = points[i - 1]
        const curr = points[i]
        const next = points[i + 1]

        const distIn = dist(prev, curr)
        const distOut = dist(curr, next)

        if (distIn === 0 || distOut === 0) {
            continue
        }

        // Cross product of the two edge vectors — zero means collinear (no real bend)
        const inDx = curr.x - prev.x
        const inDy = curr.y - prev.y
        const outDx = next.x - curr.x
        const outDy = next.y - curr.y
        const cross = inDx * outDy - inDy * outDx
        const crossNorm = Math.abs(cross) / (distIn * distOut)

        if (crossNorm < 0.01) {
            d += ` L ${curr.x} ${curr.y}`
            continue
        }

        const r = Math.min(radius, distIn / 2, distOut / 2)

        const start = lerp(curr, prev, r / distIn)
        const end = lerp(curr, next, r / distOut)

        d += ` L ${start.x} ${start.y}`
        d += ` Q ${curr.x} ${curr.y} ${end.x} ${end.y}`
    }

    const last = points[points.length - 1]
    d += ` L ${last.x} ${last.y}`

    return d
}
