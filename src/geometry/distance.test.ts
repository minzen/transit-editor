import { describe, expect, it } from 'vitest'
import { pointToLineSegmentDistance, isPointNearPolyline, isPointInPolygon } from './distance'

describe('pointToLineSegmentDistance', () => {
    it('returns perpendicular distance for point next to a horizontal segment', () => {
        expect(pointToLineSegmentDistance(
            { x: 50, y: 10 },
            { x: 0, y: 0 },
            { x: 100, y: 0 }
        )).toBe(10)
    })

    it('returns distance to nearest endpoint when projection falls before start', () => {
        expect(pointToLineSegmentDistance(
            { x: -3, y: 4 },
            { x: 0, y: 0 },
            { x: 100, y: 0 }
        )).toBe(5)
    })

    it('returns distance to nearest endpoint when projection falls past end', () => {
        expect(pointToLineSegmentDistance(
            { x: 103, y: 4 },
            { x: 0, y: 0 },
            { x: 100, y: 0 }
        )).toBe(5)
    })

    it('returns 0 when the point lies on the segment', () => {
        expect(pointToLineSegmentDistance(
            { x: 50, y: 0 },
            { x: 0, y: 0 },
            { x: 100, y: 0 }
        )).toBe(0)
    })

    it('handles a degenerate (zero-length) segment', () => {
        expect(pointToLineSegmentDistance(
            { x: 3, y: 4 },
            { x: 0, y: 0 },
            { x: 0, y: 0 }
        )).toBe(5)
    })
})

describe('isPointNearPolyline', () => {
    const polyline = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
    ]

    it('returns true when point is on the polyline', () => {
        expect(isPointNearPolyline({ x: 50, y: 0 }, polyline)).toBe(true)
    })

    it('returns true when point is within the threshold', () => {
        expect(isPointNearPolyline({ x: 50, y: 8 }, polyline, 10)).toBe(true)
    })

    it('returns false when point is outside threshold', () => {
        expect(isPointNearPolyline({ x: 50, y: 50 }, polyline, 10)).toBe(false)
    })

    it('returns false for a polyline with fewer than 2 points', () => {
        expect(isPointNearPolyline({ x: 0, y: 0 }, [{ x: 0, y: 0 }])).toBe(false)
    })
})

describe('isPointInPolygon', () => {
    const square = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
    ]

    it('returns true for a point inside the polygon', () => {
        expect(isPointInPolygon({ x: 50, y: 50 }, square)).toBe(true)
    })

    it('returns false for a point outside the polygon', () => {
        expect(isPointInPolygon({ x: 150, y: 50 }, square)).toBe(false)
    })

    it('returns true for a point on the edge', () => {
        expect(isPointInPolygon({ x: 50, y: 0 }, square)).toBe(true)
    })

    it('returns false for an empty polygon', () => {
        expect(isPointInPolygon({ x: 0, y: 0 }, [])).toBe(false)
    })
})
