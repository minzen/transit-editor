import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { BendPointRenderer } from './BendPointRenderer'
import type { Segment } from '../model/segment'

describe('BendPointRenderer', () => {
    const mockSegments: Segment[] = [
        {
            id: 'seg1',
            fromStationId: 'st1',
            toStationId: 'st2',
            lineIds: ['line1'],
            points: [
                { x: 0, y: 0 },
                { x: 100, y: 100 },
                { x: 200, y: 200 },
            ],
        },
        {
            id: 'seg2',
            fromStationId: 'st2',
            toStationId: 'st3',
            lineIds: ['line1'],
            points: [
                { x: 200, y: 200 },
                { x: 300, y: 300 },
            ],
        },
    ]

    it('renders bend points for segments with 3 points', () => {
        const onBendPointDragStart = vi.fn()
        const { container } = render(<BendPointRenderer segments={mockSegments} onBendPointDragStart={onBendPointDragStart} />)

        const circles = container.querySelectorAll('circle')
        expect(circles).toHaveLength(1)
        expect(circles[0]).toHaveAttribute('cx', '100')
        expect(circles[0]).toHaveAttribute('cy', '100')
    })

    it('does not render bend points for segments without 3 points', () => {
        const segmentsWithoutBend: Segment[] = [
            {
                id: 'seg1',
                fromStationId: 'st1',
                toStationId: 'st2',
                lineIds: ['line1'],
                points: [
                    { x: 0, y: 0 },
                    { x: 200, y: 200 },
                ],
            },
        ]
        const onBendPointDragStart = vi.fn()
        const { container } = render(<BendPointRenderer segments={segmentsWithoutBend} onBendPointDragStart={onBendPointDragStart} />)

        const circles = container.querySelectorAll('circle')
        expect(circles).toHaveLength(0)
    })

    it('calls onBendPointDragStart with correct parameters when bend point is clicked', () => {
        const onBendPointDragStart = vi.fn()
        const { container } = render(<BendPointRenderer segments={mockSegments} onBendPointDragStart={onBendPointDragStart} />)

        const circle = container.querySelector('circle')
        if (circle) {
            fireEvent.pointerDown(circle)
        }

        expect(onBendPointDragStart).toHaveBeenCalledWith('seg1', 1)
    })

    it('renders bend points with correct styling', () => {
        const onBendPointDragStart = vi.fn()
        const { container } = render(<BendPointRenderer segments={mockSegments} onBendPointDragStart={onBendPointDragStart} />)

        const circle = container.querySelector('circle')
        expect(circle).toHaveAttribute('fill', '#1976d2')
        expect(circle).toHaveAttribute('stroke', '#fff')
        expect(circle).toHaveAttribute('stroke-width', '2')
        expect(circle).toHaveAttribute('r', '6')
    })

    it('renders empty when segments array is empty', () => {
        const onBendPointDragStart = vi.fn()
        const { container } = render(<BendPointRenderer segments={[]} onBendPointDragStart={onBendPointDragStart} />)

        expect(container.firstChild).toBeNull()
    })
})
