import type { Point } from '../types/geometry'

/**
 * Euclidean distance between two points.
 */
export function distance(a: Point, b: Point): number {
    return Math.hypot(b.x - a.x, b.y - a.y)
}

/**
 * Linear interpolation between two points.
 *
 * @param t interpolation factor: 0 returns `a`, 1 returns `b`.
 */
export function lerp(a: Point, b: Point, t: number): Point {
    return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
    }
}
