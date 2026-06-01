import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMapExport } from './useMapExport'

function createMockSVG(): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    // jsdom doesn't implement getBBox; mock a minimal bounding box
    Object.defineProperty(svg, 'getBBox', {
        value: () => ({ x: 0, y: 0, width: 100, height: 100 }),
        configurable: true,
    })
    return svg
}

describe('useMapExport', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('hides interactive handles during SVG export', () => {
        vi.useFakeTimers()
        const svgEl = createMockSVG()
        const ref = { current: svgEl }
        const { result } = renderHook(() => useMapExport(ref))

        expect(result.current.showInteractiveHandlesForExport).toBe(true)

        act(() => {
            void result.current.exportAsSVG()
        })

        // After hideExportFlags is called and state is flushed
        expect(result.current.showInteractiveHandlesForExport).toBe(false)

        vi.useRealTimers()
    })

    it('hides interactive handles during PNG export', () => {
        vi.useFakeTimers()
        const svgEl = createMockSVG()
        const ref = { current: svgEl }
        const { result } = renderHook(() => useMapExport(ref))

        expect(result.current.showInteractiveHandlesForExport).toBe(true)

        act(() => {
            void result.current.exportAsPNG()
        })

        expect(result.current.showInteractiveHandlesForExport).toBe(false)

        vi.useRealTimers()
    })

    it('hides interactive handles during print', () => {
        vi.useFakeTimers()
        const svgEl = createMockSVG()
        const ref = { current: svgEl }
        const { result } = renderHook(() => useMapExport(ref))

        expect(result.current.showInteractiveHandlesForExport).toBe(true)

        act(() => {
            void result.current.print()
        })

        expect(result.current.showInteractiveHandlesForExport).toBe(false)

        vi.useRealTimers()
    })

})
