import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ShapeLayer } from './ShapeLayer'

describe('ShapeLayer', () => {
    it('renders a polygon for each shape', () => {
        const shapes = {
            'shape-1': {
                id: 'shape-1',
                points: [
                    { x: 0, y: 0 },
                    { x: 100, y: 0 },
                    { x: 100, y: 100 },
                    { x: 0, y: 100 },
                ],
                color: '#a8d5e2',
            },
        }
        const { container } = render(<ShapeLayer shapes={shapes} />)
        const polygon = container.querySelector('polygon')
        expect(polygon).not.toBeNull()
        expect(polygon?.getAttribute('points')).toBe('0,0 100,0 100,100 0,100')
        expect(polygon?.getAttribute('fill')).toBe('#a8d5e2')
        expect(polygon?.getAttribute('fill-opacity')).toBe('0.5')
    })

    it('renders multiple shapes', () => {
        const shapes = {
            'shape-1': {
                id: 'shape-1',
                points: [
                    { x: 0, y: 0 },
                    { x: 10, y: 0 },
                    { x: 10, y: 10 },
                ],
                color: 'red',
            },
            'shape-2': {
                id: 'shape-2',
                points: [
                    { x: 20, y: 20 },
                    { x: 30, y: 20 },
                    { x: 30, y: 30 },
                ],
                color: 'green',
            },
        }
        const { container } = render(<ShapeLayer shapes={shapes} />)
        const polygons = container.querySelectorAll('polygon')
        expect(polygons.length).toBe(2)
        expect(polygons[0]?.getAttribute('fill')).toBe('red')
        expect(polygons[1]?.getAttribute('fill')).toBe('green')
    })

    it('renders nothing when shapes is empty', () => {
        const { container } = render(<ShapeLayer shapes={{}} />)
        expect(container.querySelector('polygon')).toBeNull()
    })

    it('uses custom opacity when provided', () => {
        const shapes = {
            'shape-1': {
                id: 'shape-1',
                points: [
                    { x: 0, y: 0 },
                    { x: 10, y: 0 },
                    { x: 10, y: 10 },
                ],
                color: 'blue',
                opacity: 0.8,
            },
        }
        const { container } = render(<ShapeLayer shapes={shapes} />)
        const polygon = container.querySelector('polygon')
        expect(polygon?.getAttribute('fill-opacity')).toBe('0.8')
    })
})
