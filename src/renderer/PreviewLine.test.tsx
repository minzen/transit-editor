import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { PreviewLine } from './PreviewLine'

describe('PreviewLine', () => {
    const mockFromStation = { x: 0, y: 0 }
    const mockToPoint = { x: 100, y: 100 }
    const mockLineColor = '#ff0000'

    it('renders line with correct coordinates', () => {
        const { container } = render(
            <PreviewLine
                fromStation={mockFromStation}
                toPoint={mockToPoint}
                lineColor={mockLineColor}
            />
        )

        const line = container.querySelector('line')
        expect(line).toHaveAttribute('x1', '0')
        expect(line).toHaveAttribute('y1', '0')
        expect(line).toHaveAttribute('x2', '100')
        expect(line).toHaveAttribute('y2', '100')
    })

    it('renders line with correct color', () => {
        const { container } = render(
            <PreviewLine
                fromStation={mockFromStation}
                toPoint={mockToPoint}
                lineColor={mockLineColor}
            />
        )

        const line = container.querySelector('line')
        expect(line).toHaveAttribute('stroke', '#ff0000')
    })

    it('renders line with correct stroke styling', () => {
        const { container } = render(
            <PreviewLine
                fromStation={mockFromStation}
                toPoint={mockToPoint}
                lineColor={mockLineColor}
            />
        )

        const line = container.querySelector('line')
        expect(line).toHaveAttribute('stroke-width', '6')
        expect(line).toHaveAttribute('stroke-linecap', 'round')
        expect(line).toHaveAttribute('stroke-dasharray', '12 12')
        expect(line).toHaveAttribute('opacity', '0.45')
    })

    it('renders line with different coordinates', () => {
        const from = { x: 50, y: 75 }
        const to = { x: 200, y: 300 }
        const { container } = render(
            <PreviewLine
                fromStation={from}
                toPoint={to}
                lineColor='#00ff00'
            />
        )

        const line = container.querySelector('line')
        expect(line).toHaveAttribute('x1', '50')
        expect(line).toHaveAttribute('y1', '75')
        expect(line).toHaveAttribute('x2', '200')
        expect(line).toHaveAttribute('y2', '300')
        expect(line).toHaveAttribute('stroke', '#00ff00')
    })
})
