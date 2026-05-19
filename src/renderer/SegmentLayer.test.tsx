import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { SegmentLayer } from './SegmentLayer'
import type { Segment } from '../model/segment'
import type { Line } from '../model/line'

describe('SegmentLayer', () => {
    const mockLines: Record<string, Line> = {
        'line1': { id: 'line1', name: 'Line 1', color: '#ff0000' },
        'line2': { id: 'line2', name: 'Line 2', color: '#00ff00' },
        'line3': { id: 'line3', name: 'Line 3', color: '#0000ff' },
    }

    it('renders single segment with single line', () => {
        const segments: Segment[] = [
            {
                id: 'seg1',
                fromStationId: 'st1',
                toStationId: 'st2',
                lineIds: ['line1'],
                points: [
                    { x: 0, y: 0 },
                    { x: 100, y: 100 },
                ],
            },
        ]

        const { container } = render(
            <SegmentLayer segments={segments} lines={mockLines} lineWidth={4} />
        )

        const paths = container.querySelectorAll('path')
        expect(paths).toHaveLength(1)
        expect(paths[0]).toHaveAttribute('stroke', '#ff0000')
    })

    it('renders single segment with multiple lines', () => {
        const segments: Segment[] = [
            {
                id: 'seg1',
                fromStationId: 'st1',
                toStationId: 'st2',
                lineIds: ['line1', 'line2', 'line3'],
                points: [
                    { x: 0, y: 0 },
                    { x: 100, y: 100 },
                ],
            },
        ]

        const { container } = render(
            <SegmentLayer segments={segments} lines={mockLines} lineWidth={4} />
        )

        const paths = container.querySelectorAll('path')
        expect(paths).toHaveLength(3)
        expect(paths[0]).toHaveAttribute('stroke', '#ff0000')
        expect(paths[1]).toHaveAttribute('stroke', '#00ff00')
        expect(paths[2]).toHaveAttribute('stroke', '#0000ff')
    })

    it('renders multiple segments with different line combinations', () => {
        const segments: Segment[] = [
            {
                id: 'seg1',
                fromStationId: 'st1',
                toStationId: 'st2',
                lineIds: ['line1'],
                points: [
                    { x: 0, y: 0 },
                    { x: 100, y: 100 },
                ],
            },
            {
                id: 'seg2',
                fromStationId: 'st2',
                toStationId: 'st3',
                lineIds: ['line2', 'line3'],
                points: [
                    { x: 100, y: 100 },
                    { x: 200, y: 200 },
                ],
            },
        ]

        const { container } = render(
            <SegmentLayer segments={segments} lines={mockLines} lineWidth={4} />
        )

        const paths = container.querySelectorAll('path')
        expect(paths).toHaveLength(3)
    })

    it('skips rendering when lineId is invalid', () => {
        const segments: Segment[] = [
            {
                id: 'seg1',
                fromStationId: 'st1',
                toStationId: 'st2',
                lineIds: ['line1', 'invalid-line'],
                points: [
                    { x: 0, y: 0 },
                    { x: 100, y: 100 },
                ],
            },
        ]

        const { container } = render(
            <SegmentLayer segments={segments} lines={mockLines} lineWidth={4} />
        )

        const paths = container.querySelectorAll('path')
        // Only renders for valid lineId
        expect(paths).toHaveLength(1)
    })

    it('renders empty when segments array is empty', () => {
        const { container } = render(
            <SegmentLayer segments={[]} lines={mockLines} lineWidth={4} />
        )

        expect(container.firstChild).toBeNull()
    })

    it('uses correct line width from prop', () => {
        const segments: Segment[] = [
            {
                id: 'seg1',
                fromStationId: 'st1',
                toStationId: 'st2',
                lineIds: ['line1'],
                points: [
                    { x: 0, y: 0 },
                    { x: 100, y: 100 },
                ],
            },
        ]

        const { container } = render(
            <SegmentLayer segments={segments} lines={mockLines} lineWidth={8} />
        )

        const paths = container.querySelectorAll('path')
        expect(paths[0]).toHaveAttribute('stroke-width', '8')
    })

    it('generates correct path data for segment with bend points', () => {
        const segments: Segment[] = [
            {
                id: 'seg1',
                fromStationId: 'st1',
                toStationId: 'st2',
                lineIds: ['line1'],
                points: [
                    { x: 0, y: 0 },
                    { x: 50, y: 50 },
                    { x: 100, y: 100 },
                ],
            },
        ]

        const { container } = render(
            <SegmentLayer segments={segments} lines={mockLines} lineWidth={4} />
        )

        const paths = container.querySelectorAll('path')
        expect(paths[0]).toHaveAttribute('d', 'M 0 0 L 50 50 L 100 100')
    })
})
