import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
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

    it('generates path data with endpoints trimmed by station radius', () => {
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
        const d = paths[0].getAttribute('d') ?? ''

        // Diagonal segment of length sqrt(50^2 + 50^2) ≈ 70.71.
        // Trim 10 px from each end (STATION_RADIUS 8 + PADDING 2)
        // => start ≈ (7.07, 7.07), end ≈ (92.93, 92.93).
        // Interior bend point (50, 50) is preserved and rounded via quadratic bezier.
        expect(d).toContain('Q 50 50')
        const match = d.match(/^M ([\d.]+) ([\d.]+)/)
        expect(match).not.toBeNull()
        if (match) {
            const [, sx, sy] = match
            expect(parseFloat(sx)).toBeCloseTo(7.07, 1)
            expect(parseFloat(sy)).toBeCloseTo(7.07, 1)
        }
        const endMatch = d.match(/L ([\d.]+) ([\d.]+)$/)
        expect(endMatch).not.toBeNull()
        if (endMatch) {
            const [, ex, ey] = endMatch
            expect(parseFloat(ex)).toBeCloseTo(92.93, 1)
            expect(parseFloat(ey)).toBeCloseTo(92.93, 1)
        }
    })

    it('renders dashed line with stroke-dasharray', () => {
        const dashedLines: Record<string, Line> = {
            'line1': { id: 'line1', name: 'Line 1', color: '#ff0000', lineStyle: 'dashed' },
        }
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
            <SegmentLayer segments={segments} lines={dashedLines} lineWidth={4} />
        )

        const paths = container.querySelectorAll('path')
        expect(paths).toHaveLength(1)
        expect(paths[0]).toHaveAttribute('stroke-dasharray', '8 4')
    })

    it('renders double line as two paths', () => {
        const doubleLines: Record<string, Line> = {
            'line1': { id: 'line1', name: 'Line 1', color: '#ff0000', lineStyle: 'double' },
        }
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
            <SegmentLayer segments={segments} lines={doubleLines} lineWidth={4} />
        )

        const paths = container.querySelectorAll('path')
        expect(paths).toHaveLength(2)
        expect(paths[0]).toHaveAttribute('stroke-width', '7')
        expect(paths[0]).toHaveAttribute('opacity', '0.35')
        expect(paths[1]).toHaveAttribute('stroke-width', '4')
        expect(paths[1]).not.toHaveAttribute('stroke-dasharray')
    })

    it('highlights hovered segment with thicker stroke', () => {
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
            <SegmentLayer segments={segments} lines={mockLines} lineWidth={4} hoveredSegmentId="seg1" />
        )

        const paths = container.querySelectorAll('path')
        expect(paths[0]).toHaveAttribute('stroke-width', '6')
    })

    it('dims segments not on selected line', () => {
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
                lineIds: ['line2'],
                points: [
                    { x: 100, y: 100 },
                    { x: 200, y: 200 },
                ],
            },
        ]

        const { container } = render(
            <SegmentLayer segments={segments} lines={mockLines} lineWidth={4} selectedLineId="line1" />
        )

        const groups = container.querySelectorAll('g')
        // First group (seg1 on selected line) should have opacity 1
        const seg1Path = groups[0].querySelector('path')
        expect(seg1Path).toHaveAttribute('opacity', '1')
        // Second group (seg2 not on selected line) should be dimmed
        const seg2Path = groups[1].querySelector('path')
        expect(seg2Path).toHaveAttribute('opacity', '0.25')
    })

    it('parallel paths on a horizontal segment are offset symmetrically above and below', () => {
        const segments: Segment[] = [
            {
                id: 'seg1',
                fromStationId: 'st1',
                toStationId: 'st2',
                lineIds: ['line1', 'line2'],
                points: [
                    { x: 0, y: 0 },
                    { x: 500, y: 0 },
                ],
            },
        ]

        const { container } = render(
            <SegmentLayer segments={segments} lines={mockLines} lineWidth={10} />
        )

        const paths = container.querySelectorAll('path')
        expect(paths).toHaveLength(2)

        // Extract the M (start) y-coordinate from each path
        const getStartY = (path: Element) => {
            const d = path.getAttribute('d') ?? ''
            const m = d.match(/^M [\d.-]+ ([\d.-]+)/)
            return m ? parseFloat(m[1]) : NaN
        }

        const y0 = getStartY(paths[0])
        const y1 = getStartY(paths[1])

        // The two lines should be on opposite sides of y=0
        expect(y0).not.toBeNaN()
        expect(y1).not.toBeNaN()
        expect(y0).not.toBeCloseTo(0, 1)
        expect(y1).not.toBeCloseTo(0, 1)
        // They must be mirror images (opposite sign)
        expect(y0 + y1).toBeCloseTo(0, 5)
    })

    it('calls onSegmentMouseEnter and onSegmentMouseLeave', () => {
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

        const onEnter = vi.fn()
        const onLeave = vi.fn()

        const { container } = render(
            <SegmentLayer
                segments={segments}
                lines={mockLines}
                lineWidth={4}
                onSegmentMouseEnter={onEnter}
                onSegmentMouseLeave={onLeave}
            />
        )

        const g = container.querySelector('g')
        expect(g).not.toBeNull()
        if (g) {
            fireEvent.mouseEnter(g)
            expect(onEnter).toHaveBeenCalledWith('seg1', expect.anything())
            fireEvent.mouseLeave(g)
            expect(onLeave).toHaveBeenCalledWith('seg1')
        }
    })
})
