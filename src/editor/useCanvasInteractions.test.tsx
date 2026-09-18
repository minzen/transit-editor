import { act, renderHook } from '@testing-library/react'
import type { PointerEvent } from 'react'
import { describe, expect, it } from 'vitest'
import { useEditorStore } from '../store/editorStore'
import { useCanvasInteractions } from './useCanvasInteractions'

const points = [
    { x: 0, y: 0 }, { x: 80, y: 0 }, { x: 120, y: 40 },
    { x: 160, y: 80 }, { x: 240, y: 80 },
]

describe('bend dragging', () => {
    it.each([false, true])('uses neighboring bends (freeform: %s)', (freeformMode) => {
        useEditorStore.setState({
            freeformMode, gridCellSize: 20,
            viewport: { zoom: 2, offsetX: 10, offsetY: 30 },
            segments: { segment: {
                id: 'segment', fromStationId: 'start', toStationId: 'end',
                lineIds: [], points,
            } },
        })
        const { result } = renderHook(() => useCanvasInteractions({
            spacePressed: false, selectedStationIds: [], selectedShapeIds: [],
        }))
        act(() => result.current.setDraggingBendPoint({ segmentId: 'segment', pointIndex: 2 }))
        act(() => result.current.handlePointerMove({
            clientX: 255, clientY: 153,
            currentTarget: { getBoundingClientRect: () => ({ left: 5, top: 3 }) },
        } as PointerEvent<SVGSVGElement>))
        const updated = useEditorStore.getState().segments.segment.points
        expect(updated[2]).toEqual(freeformMode ? { x: 120, y: 60 } : { x: 130, y: 50 })
        expect(updated.filter((_, index) => index !== 2)).toEqual(points.filter((_, index) => index !== 2))
    })
})
