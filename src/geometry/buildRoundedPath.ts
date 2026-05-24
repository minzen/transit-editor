import type { Point } from '../types/geometry'

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

    const dist = (a: Point, b: Point): number =>
        Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)

    const lerp = (a: Point, b: Point, t: number): Point => ({
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
    })

    let d = `M ${points[0].x} ${points[0].y}`

    for (let i = 1; i < points.length - 1; i++) {
        const prev = points[i - 1]
        const curr = points[i]
        const next = points[i + 1]

        const distIn = dist(prev, curr)
        const distOut = dist(curr, next)
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
