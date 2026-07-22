import { describe, it, expect } from 'vitest'
import { distance, lerp } from './vector'

describe('distance', () => {
    it('returns 0 for identical points', () => {
        expect(distance({ x: 3, y: 4 }, { x: 3, y: 4 })).toBe(0)
    })

    it('computes the Euclidean distance', () => {
        expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
    })

    it('is symmetric', () => {
        const a = { x: -2, y: 7 }
        const b = { x: 5, y: -1 }
        expect(distance(a, b)).toBeCloseTo(distance(b, a))
    })
})

describe('lerp', () => {
    it('returns a at t=0', () => {
        expect(lerp({ x: 1, y: 2 }, { x: 5, y: 6 }, 0)).toEqual({ x: 1, y: 2 })
    })

    it('returns b at t=1', () => {
        expect(lerp({ x: 1, y: 2 }, { x: 5, y: 6 }, 1)).toEqual({ x: 5, y: 6 })
    })

    it('returns the midpoint at t=0.5', () => {
        expect(lerp({ x: 0, y: 0 }, { x: 10, y: 20 }, 0.5)).toEqual({ x: 5, y: 10 })
    })
})
