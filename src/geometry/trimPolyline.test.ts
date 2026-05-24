import { describe, expect, it } from 'vitest'
import { trimPolyline } from './trimPolyline'

describe('trimPolyline', () => {
    it('returns points unchanged when fewer than 2 points', () => {
        expect(trimPolyline([{ x: 1, y: 2 }], 5, 5)).toEqual([{ x: 1, y: 2 }])
    })

    it('returns points unchanged when both trims are 0', () => {
        const points = [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
        ]
        expect(trimPolyline(points, 0, 0)).toEqual(points)
    })

    it('trims the start of a horizontal segment', () => {
        const points = [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
        ]
        expect(trimPolyline(points, 10, 0)).toEqual([
            { x: 10, y: 0 },
            { x: 100, y: 0 },
        ])
    })

    it('trims the end of a horizontal segment', () => {
        const points = [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
        ]
        expect(trimPolyline(points, 0, 10)).toEqual([
            { x: 0, y: 0 },
            { x: 90, y: 0 },
        ])
    })

    it('trims both ends along the segment direction', () => {
        const points = [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
        ]
        expect(trimPolyline(points, 5, 15)).toEqual([
            { x: 5, y: 0 },
            { x: 85, y: 0 },
        ])
    })

    it('preserves interior vertices', () => {
        const points = [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
        ]
        const result = trimPolyline(points, 10, 10)
        expect(result[1]).toEqual({ x: 100, y: 0 })
        expect(result[0]).toEqual({ x: 10, y: 0 })
        expect(result[2]).toEqual({ x: 100, y: 90 })
    })

    it('clamps trim to the length of a short first segment', () => {
        const points = [
            { x: 0, y: 0 },
            { x: 5, y: 0 },
            { x: 100, y: 0 },
        ]
        const result = trimPolyline(points, 50, 0)
        // First segment is only 5 long; trimming clamps to its endpoint
        expect(result[0]).toEqual({ x: 5, y: 0 })
    })

    it('handles diagonal segments', () => {
        const points = [
            { x: 0, y: 0 },
            { x: 30, y: 40 },
        ]
        // Length is 50, trim 10 from start moves 1/5 along
        expect(trimPolyline(points, 10, 0)).toEqual([
            { x: 6, y: 8 },
            { x: 30, y: 40 },
        ])
    })
})
