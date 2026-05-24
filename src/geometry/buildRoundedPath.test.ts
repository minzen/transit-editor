import { describe, expect, it } from 'vitest'
import { buildRoundedPolylinePath } from './buildRoundedPath'

describe('buildRoundedPolylinePath', () => {
    it('returns empty string for empty points', () => {
        expect(buildRoundedPolylinePath([])).toBe('')
    })

    it('returns single move for one point', () => {
        expect(buildRoundedPolylinePath([{ x: 10, y: 20 }])).toBe('M 10 20')
    })

    it('returns straight line for two points', () => {
        expect(buildRoundedPolylinePath([
            { x: 0, y: 0 },
            { x: 100, y: 0 },
        ])).toBe('M 0 0 L 100 0')
    })

    it('inserts a quadratic bezier for a 90° corner', () => {
        const d = buildRoundedPolylinePath([
            { x: 0, y: 0 },
            { x: 0, y: 100 },
            { x: 100, y: 100 },
        ])
        expect(d).toContain('Q 0 100')
    })

    it('inserts quadratic beziers for multiple bends', () => {
        const d = buildRoundedPolylinePath([
            { x: 0, y: 0 },
            { x: 0, y: 100 },
            { x: 100, y: 100 },
            { x: 100, y: 200 },
        ])
        expect(d).toContain('Q 0 100')
        expect(d).toContain('Q 100 100')
    })

    it('respects the corner radius', () => {
        // Short segments: radius should be clamped to half the shortest leg
        const d = buildRoundedPolylinePath([
            { x: 0, y: 0 },
            { x: 0, y: 10 },
            { x: 10, y: 10 },
        ], 100)
        // Radius 100 is way larger than the 10-unit legs, so it gets clamped
        expect(d).toContain('Q 0 10')
    })
})
