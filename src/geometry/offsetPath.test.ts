import { describe, expect, it } from 'vitest'
import { offsetPath } from './offsetPath'

describe('offsetPath', () => {
    it('returns original points if less than 2 points', () => {
        const points = [{ x: 10, y: 10 }]
        expect(offsetPath(points, 5)).toEqual(points)
    })

    it('returns original points if distance is 0', () => {
        const points = [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
        ]
        expect(offsetPath(points, 0)).toEqual(points)
    })

    it('offsets a horizontal segment vertically', () => {
        const points = [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
        ]
        // Positive offset (clockwise rotated: -dy, dx -> dx=100, dy=0 -> normal: 0, 1)
        const offset = offsetPath(points, 10)
        expect(offset[0]).toEqual({ x: 0, y: 10 })
        expect(offset[1]).toEqual({ x: 100, y: 10 })
    })

    it('offsets a vertical segment horizontally', () => {
        const points = [
            { x: 0, y: 0 },
            { x: 0, y: 100 },
        ]
        // dx=0, dy=100 -> normal: -1, 0
        const offset = offsetPath(points, 10)
        expect(offset[0]).toEqual({ x: -10, y: 0 })
        expect(offset[1]).toEqual({ x: -10, y: 100 })
    })

    it('correctly calculates miter joints for a 90-degree corner', () => {
        const points = [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
        ]
        // Segment 1: normal is (0, 1)
        // Segment 2: normal is (-1, 0)
        // Bisector for the corner: normal 1 + normal 2 = (-1, 1). Normalized: (-1/sqrt(2), 1/sqrt(2))
        // Half-angle is 45 degrees. scale = 1 / cos(45) = sqrt(2).
        // Corner shift: x + bx * d * scale = 100 - (1/sqrt(2)) * 10 * sqrt(2) = 90
        //               y + by * d * scale = 0 + (1/sqrt(2)) * 10 * sqrt(2) = 10
        const offset = offsetPath(points, 10)
        expect(offset[0]).toEqual({ x: 0, y: 10 })
        expect(Math.round(offset[1].x)).toBe(90)
        expect(Math.round(offset[1].y)).toBe(10)
        expect(offset[2]).toEqual({ x: 90, y: 100 })
    })
})
