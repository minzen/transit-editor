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

    it('positive and negative offsets stay on opposite sides of a straight segment', () => {
        const points = [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
        ]
        const pos = offsetPath(points, 10)
        const neg = offsetPath(points, -10)
        // Positive offset moves up (normal is (0,1))
        expect(pos[0].y).toBeCloseTo(10)
        // Negative offset moves down
        expect(neg[0].y).toBeCloseTo(-10)
    })

    it('handles a concave (S-bend) corner: both offset directions stay on their own side', () => {
        // Path goes right then bends back left — concave corner for the top offset
        // Horizontal right: (0,0) -> (100,0), normal (0,1)
        // Then bends left-down:  (100,0) -> (100,-100), normal (-1,0) for second segment
        // At the corner the bend turns inward (concave from the top offset side)
        const points = [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 0, y: 0 }, // hairpin back
        ]
        const pos = offsetPath(points, 10)
        const neg = offsetPath(points, -10)
        // The middle offset point for +d should be above the original, not below
        expect(pos[1].y).toBeGreaterThan(0)
        // The middle offset point for -d should be below the original
        expect(neg[1].y).toBeLessThan(0)
    })

    it('concave 90-degree inner corner: inner offset does not cross centerline', () => {
        // U-shape: right -> down -> left. Corner at (100,0) turns concave for d>0 (top side)
        // Segment 1: (0,0)->(100,0), normal (0,1)
        // Segment 2: (100,0)->(100,100), normal (-1,0)
        // Corner goes convex outward — test the *other* turn
        // Inner path (d<0): offset should move the corner inward from the original
        const points = [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
        ]
        const inner = offsetPath(points, -10)
        // For d=-10 the inner (right side) corner shifts to x=110, y=-10
        // n1=(0,1), n2=(-1,0), bisector=(-1,1)/√2, dot with n1 = 1/√2 > 0 (no flip)
        // corner = (100 + (-1/√2)*(-10)*√2, 0 + (1/√2)*(-10)*√2) = (110, -10)
        expect(Math.round(inner[1].x)).toBe(110)
        expect(Math.round(inner[1].y)).toBe(-10)
    })
})
