import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { StationRenderer } from './StationRenderer'
import type { Station } from '../model/station'
import type { EditorTool } from '../store/editorStore'

describe('StationRenderer', () => {
    const mockStations: Record<string, Station> = {
        st1: { id: 'st1', x: 100, y: 100, name: 'Station 1' },
        st2: { id: 'st2', x: 200, y: 200 },
        st3: { id: 'st3', x: 300, y: 300, name: 'Station 3' },
    }

    const mockOnStationPointerDown = vi.fn()
    const mockOnStationDoubleClick = vi.fn()

    const defaultProps = {
        stations: mockStations,
        activeTool: 'select' as EditorTool,
        selectedStationId: null,
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

    it('renders selection indicator when selectedStationId matches', () => {
        const { container } = render(
            <StationRenderer
                {...defaultProps}
                selectedStationId="st1"
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
            expect(circle).toHaveAttribute('fill', '#111')
            expect(circle).toHaveAttribute('r', '8')
        })
    })
})
