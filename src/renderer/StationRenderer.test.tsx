import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { StationRenderer } from './StationRenderer'
import type { Station } from '../model/station'
import type { Segment } from '../model/segment'
import type { Line } from '../model/line'
import type { EditorTool } from '../store/editorStore'

describe('StationRenderer', () => {
    const mockStations: Record<string, Station> = {
        st1: { id: 'st1', x: 100, y: 100, name: 'Station 1' },
        st2: { id: 'st2', x: 200, y: 200 },
        st3: { id: 'st3', x: 300, y: 300, name: 'Station 3' },
    }

    const mockSegments: Record<string, Segment> = {}

    const mockOnStationPointerDown = vi.fn()
    const mockOnStationDoubleClick = vi.fn()

    const defaultProps = {
        stations: mockStations,
        segments: mockSegments,
        lineWidth: 4,
        activeTool: 'select' as EditorTool,
        selectedStationIds: [],
        pendingStationId: null,
        onStationPointerDown: mockOnStationPointerDown,
        onStationDoubleClick: mockOnStationDoubleClick,
    }

    it('renders all stations', () => {
        const { container } = render(<StationRenderer {...defaultProps} />)

        const circles = container.querySelectorAll('circle')
        // 3 main station circles
        expect(circles.length).toBeGreaterThanOrEqual(3)
    })

    it('renders station circles with correct coordinates', () => {
        const { container } = render(<StationRenderer {...defaultProps} />)

        const circles = container.querySelectorAll('circle')
        expect(circles[0]).toHaveAttribute('cx', '100')
        expect(circles[0]).toHaveAttribute('cy', '100')
        expect(circles[1]).toHaveAttribute('cx', '200')
        expect(circles[1]).toHaveAttribute('cy', '200')
    })

    it('renders station names when present', () => {
        const { container } = render(<StationRenderer {...defaultProps} />)

        const texts = container.querySelectorAll('text')
        expect(texts.length).toBeGreaterThanOrEqual(2)
        expect(texts[0].textContent).toBe('Station 1')
        expect(texts[1].textContent).toBe('Station 3')
    })

    it('does not render name when station has no name', () => {
        const stationsWithoutName: Record<string, Station> = {
            st1: { id: 'st1', x: 100, y: 100 },
        }
        const { container } = render(
            <StationRenderer
                {...defaultProps}
                stations={stationsWithoutName}
            />
        )

        const texts = container.querySelectorAll('text')
        expect(texts).toHaveLength(0)
    })

    it('calls onStationPointerDown when station is clicked', () => {
        const { container } = render(<StationRenderer {...defaultProps} />)

        const circles = container.querySelectorAll('circle')
        fireEvent.pointerDown(circles[0])

        expect(mockOnStationPointerDown).toHaveBeenCalledWith('st1', expect.any(Object))
    })

    it('calls onStationDoubleClick when station is double-clicked', () => {
        const { container } = render(<StationRenderer {...defaultProps} />)

        const circles = container.querySelectorAll('circle')
        fireEvent.doubleClick(circles[0])

        expect(mockOnStationDoubleClick).toHaveBeenCalledWith('st1')
    })

    it('renders pending station indicator when pendingStationId matches', () => {
        const { container } = render(
            <StationRenderer
                {...defaultProps}
                activeTool="segment"
                pendingStationId="st1"
            />
        )

        const circles = container.querySelectorAll('circle')
        // Should have pending indicator circle + main circles
        expect(circles.length).toBeGreaterThan(3)
    })

    it('renders selection indicator when selectedStationIds includes station', () => {
        const { container } = render(
            <StationRenderer
                {...defaultProps}
                selectedStationIds={['st1']}
            />
        )

        const circles = container.querySelectorAll('circle')
        // Should have selection indicator circle + main circles
        expect(circles.length).toBeGreaterThan(3)
    })

    it('renders empty when stations object is empty', () => {
        const { container } = render(
            <StationRenderer
                {...defaultProps}
                stations={{}}
            />
        )

        expect(container.firstChild).toBeNull()
    })

    it('renders station circles with correct styling', () => {
        const { container } = render(<StationRenderer {...defaultProps} />)

        const circles = container.querySelectorAll('circle')
        // Main station circles
        circles.forEach(circle => {
            expect(circle).toHaveAttribute('fill', '#fff')
            expect(circle).toHaveAttribute('stroke', '#111')
            expect(circle).toHaveAttribute('r', '8')
        })
    })

    it('renders capsule rect for stations connected to multiple lines', () => {
        const segmentsWithMultipleLines: Record<string, Segment> = {
            seg1: {
                id: 'seg1',
                fromStationId: 'st1',
                toStationId: 'st2',
                lineIds: ['line1', 'line2'],
                points: [
                    { x: 100, y: 100 },
                    { x: 200, y: 200 },
                ],
            },
        }
        const { container } = render(
            <StationRenderer
                {...defaultProps}
                segments={segmentsWithMultipleLines}
            />
        )

        const rects = container.querySelectorAll('rect')
        // st1 and st2 are both transfer stations with 2 lines -> 2 capsules
        expect(rects.length).toBe(2)
        rects.forEach(rect => {
            expect(rect).toHaveAttribute('fill', '#fff')
            expect(rect).toHaveAttribute('stroke', '#111')
            expect(rect).toHaveAttribute('rx')
            expect(rect).toHaveAttribute('transform')
        })
    })

    it('renders line code badges for connected lines that have a code', () => {
        const stations: Record<string, Station> = {
            s1: { id: 's1', x: 100, y: 100, name: 'A' },
            s2: { id: 's2', x: 200, y: 100, name: 'B' },
        }
        const segments: Record<string, Segment> = {
            seg1: {
                id: 'seg1',
                fromStationId: 's1',
                toStationId: 's2',
                lineIds: ['L1', 'L2'],
                points: [{ x: 100, y: 100 }, { x: 200, y: 100 }],
            },
        }
        const lines = {
            L1: { id: 'L1', name: 'Metro 1', color: '#1976d2', code: 'M1' },
            L2: { id: 'L2', name: 'Metro 2', color: '#d32f2f', code: '2' },
        }
        const { container } = render(
            <StationRenderer {...defaultProps} stations={stations} segments={segments} lines={lines} />
        )

        const badgeTexts = Array.from(container.querySelectorAll('text'))
            .map((t) => t.textContent)
        // Each station should show both line codes
        expect(badgeTexts).toContain('M1')
        expect(badgeTexts).toContain('2')
        // Two stations × two badges = 4 badge codes total
        const m1count = badgeTexts.filter((t) => t === 'M1').length
        expect(m1count).toBe(2)
    })

    it('omits line code badges for lines without a code', () => {
        const stations: Record<string, Station> = {
            s1: { id: 's1', x: 100, y: 100, name: 'A' },
            s2: { id: 's2', x: 200, y: 100, name: 'B' },
        }
        const segments: Record<string, Segment> = {
            seg1: {
                id: 'seg1',
                fromStationId: 's1',
                toStationId: 's2',
                lineIds: ['L1'],
                points: [{ x: 100, y: 100 }, { x: 200, y: 100 }],
            },
        }
        const lines = {
            L1: { id: 'L1', name: 'Plain Line', color: '#1976d2' },
        }
        const { container } = render(
            <StationRenderer {...defaultProps} stations={stations} segments={segments} lines={lines} />
        )

        // Station names render as text elements, but no badges => no extra
        // text nodes beyond the station names themselves.
        const texts = Array.from(container.querySelectorAll('text'))
            .map((t) => t.textContent)
        expect(texts).toEqual(['A', 'B'])
    })

    it('hides line code badges when showLineCodes is false', () => {
        const stations: Record<string, Station> = {
            s1: { id: 's1', x: 100, y: 100, name: 'A' },
            s2: { id: 's2', x: 200, y: 100, name: 'B' },
        }
        const segments: Record<string, Segment> = {
            seg1: {
                id: 'seg1',
                fromStationId: 's1',
                toStationId: 's2',
                lineIds: ['L1'],
                points: [{ x: 100, y: 100 }, { x: 200, y: 100 }],
            },
        }
        const lines = {
            L1: { id: 'L1', name: 'Metro 1', color: '#1976d2', code: 'M1' },
        }
        const { container } = render(
            <StationRenderer {...defaultProps} stations={stations} segments={segments} lines={lines} showLineCodes={false} />
        )

        const texts = Array.from(container.querySelectorAll('text'))
            .map((t) => t.textContent)
        expect(texts).toEqual(['A', 'B'])
        expect(texts).not.toContain('M1')
    })

    it('positions label above station by default', () => {
        const stations: Record<string, Station> = {
            s1: { id: 's1', x: 100, y: 100, name: 'A' },
        }
        const { container } = render(
            <StationRenderer {...defaultProps} stations={stations} />
        )
        const text = container.querySelector('text')
        expect(text).toHaveAttribute('text-anchor', 'middle')
        expect(Number(text?.getAttribute('y'))).toBeLessThan(100)
    })

    it('positions label below station when labelPosition is bottom', () => {
        const stations: Record<string, Station> = {
            s1: { id: 's1', x: 100, y: 100, name: 'A', labelPosition: 'bottom' },
        }
        const { container } = render(
            <StationRenderer {...defaultProps} stations={stations} />
        )
        const text = container.querySelector('text')
        expect(text).toHaveAttribute('text-anchor', 'middle')
        expect(Number(text?.getAttribute('y'))).toBeGreaterThan(100)
    })

    it('positions label to the left of station when labelPosition is left', () => {
        const stations: Record<string, Station> = {
            s1: { id: 's1', x: 100, y: 100, name: 'A', labelPosition: 'left' },
        }
        const { container } = render(
            <StationRenderer {...defaultProps} stations={stations} />
        )
        const text = container.querySelector('text')
        expect(text).toHaveAttribute('text-anchor', 'end')
        expect(Number(text?.getAttribute('x'))).toBeLessThan(100)
        expect(Number(text?.getAttribute('y'))).toBe(100)
    })

    it('positions label to the right of station when labelPosition is right', () => {
        const stations: Record<string, Station> = {
            s1: { id: 's1', x: 100, y: 100, name: 'A', labelPosition: 'right' },
        }
        const { container } = render(
            <StationRenderer {...defaultProps} stations={stations} />
        )
        const text = container.querySelector('text')
        expect(text).toHaveAttribute('text-anchor', 'start')
        expect(Number(text?.getAttribute('x'))).toBeGreaterThan(100)
        expect(Number(text?.getAttribute('y'))).toBe(100)
    })

    it('dims stations not on selected line', () => {
        const stations: Record<string, Station> = {
            onLine: { id: 'onLine', x: 0, y: 0, name: 'OnLine' },
            offLine: { id: 'offLine', x: 100, y: 0, name: 'OffLine' },
        }
        const segs: Record<string, Segment> = {
            seg1: { id: 'seg1', fromStationId: 'onLine', toStationId: 'mid', lineIds: ['line1'], points: [{ x: 0, y: 0 }, { x: 50, y: 0 }] },
            seg2: { id: 'seg2', fromStationId: 'mid', toStationId: 'offLine', lineIds: ['line2'], points: [{ x: 50, y: 0 }, { x: 100, y: 0 }] },
        }
        const lines: Record<string, Line> = {
            line1: { id: 'line1', name: 'L1', color: '#ff0000' },
            line2: { id: 'line2', name: 'L2', color: '#00ff00' },
        }
        const { container } = render(
            <StationRenderer
                {...defaultProps}
                stations={stations}
                segments={segs}
                lines={lines}
                selectedLineId="line1"
            />
        )
        const groups = container.querySelectorAll('g')
        expect(groups[0]).toHaveAttribute('opacity', '1')
        expect(groups[1]).toHaveAttribute('opacity', '0.25')
    })

    it('renders service icons separately from station name', () => {
        const stations: Record<string, Station> = {
            s1: { id: 's1', x: 100, y: 100, name: 'A', services: ['accessibility', 'rail'] },
            s2: { id: 's2', x: 200, y: 100, name: 'B' },
        }
        const { container } = render(
            <StationRenderer {...defaultProps} stations={stations} />
        )
        const texts = Array.from(container.querySelectorAll('text')).map((t) => t.textContent)
        // Name and icons are now in separate text elements
        expect(texts).toContain('A')
        expect(texts).toContain('♿ 🚂')
        expect(texts).toContain('B')
        expect(texts).not.toContain('⛴')
    })

    it('renders new service icons (airport and toilet)', () => {
        const stations: Record<string, Station> = {
            s1: { id: 's1', x: 100, y: 100, name: 'Airport Station', services: ['airport', 'toilet'] },
        }
        const { container } = render(
            <StationRenderer {...defaultProps} stations={stations} />
        )
        const texts = Array.from(container.querySelectorAll('text')).map((t) => t.textContent)
        // Name and icons are in separate text elements
        expect(texts).toContain('Airport Station')
        expect(texts).toContain('✈ 🚻')
    })

    it('does not render service icons when services array is empty', () => {
        const stations: Record<string, Station> = {
            s1: { id: 's1', x: 100, y: 100, name: 'A', services: [] },
        }
        const { container } = render(
            <StationRenderer {...defaultProps} stations={stations} />
        )
        const texts = Array.from(container.querySelectorAll('text')).map((t) => t.textContent)
        expect(texts).toEqual(['A'])
    })

    it('renders service icons even when station has no name', () => {
        const stations: Record<string, Station> = {
            s1: { id: 's1', x: 100, y: 100, services: ['accessibility', 'toilet'] },
        }
        const { container } = render(
            <StationRenderer {...defaultProps} stations={stations} />
        )
        const texts = Array.from(container.querySelectorAll('text')).map((t) => t.textContent)
        // Icons should appear even without a station name
        expect(texts).toContain('♿ 🚻')
        // Should not contain any name text
        expect(texts).not.toContain('A')
    })

    it('renders fare zone badge above station with fareZone', () => {
        const stations: Record<string, Station> = {
            s1: { id: 's1', x: 100, y: 100, name: 'A', fareZone: 3 },
            s2: { id: 's2', x: 200, y: 100, name: 'B' },
        }
        const { container } = render(
            <StationRenderer {...defaultProps} stations={stations} />
        )
        const texts = Array.from(container.querySelectorAll('text')).map((t) => t.textContent)
        expect(texts).toContain('3')
        // s2 has no fareZone, so only 'A' and 'B' should appear
        const stationNames = texts.filter((t) => t === 'A' || t === 'B')
        expect(stationNames).toEqual(['A', 'B'])
    })

    it('does not render fare zone badge when fareZone is absent', () => {
        const stations: Record<string, Station> = {
            s1: { id: 's1', x: 100, y: 100, name: 'A' },
        }
        const { container } = render(
            <StationRenderer {...defaultProps} stations={stations} />
        )
        const texts = Array.from(container.querySelectorAll('text')).map((t) => t.textContent)
        expect(texts).toEqual(['A'])
    })
})
