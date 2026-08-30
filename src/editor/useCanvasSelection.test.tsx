import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useEditorStore } from '../store/editorStore'
import { useCanvasSelection } from './useCanvasSelection'

describe('useCanvasSelection', () => {
    beforeEach(() => {
        useEditorStore.getState().clear()
        useEditorStore.getState().addStation(10, 10)
        useEditorStore.getState().addStation(100, 100)
        useEditorStore.getState().addShape(
            [{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 0, y: 20 }],
            '#00ff00',
        )
    })

    it('selects every station and shape', () => {
        const { result } = renderHook(() => useCanvasSelection())

        act(() => result.current.selectAll())

        expect(result.current.selectedStationIds).toEqual(
            Object.keys(useEditorStore.getState().stations),
        )
        expect(result.current.selectedShapeIds).toEqual(
            Object.keys(useEditorStore.getState().shapes),
        )
    })

    it('deletes selected entities and clears the selection', () => {
        const { result } = renderHook(() => useCanvasSelection())

        act(() => result.current.selectAll())
        act(() => result.current.deleteSelected())

        expect(useEditorStore.getState().stations).toEqual({})
        expect(useEditorStore.getState().shapes).toEqual({})
        expect(result.current.selectedStationIds).toEqual([])
        expect(result.current.selectedShapeIds).toEqual([])
    })

    it('tracks a single primary shape and removes stations independently', () => {
        const { result } = renderHook(() => useCanvasSelection())
        const stationIds = Object.keys(useEditorStore.getState().stations)
        const shapeId = Object.keys(useEditorStore.getState().shapes)[0]

        act(() => {
            result.current.setSelectedStationIds(stationIds)
            result.current.setSelectedShapeId(shapeId)
        })
        act(() => result.current.removeStationFromSelection(stationIds[0]))

        expect(result.current.selectedStationIds).toEqual([stationIds[1]])
        expect(result.current.selectedShapeId).toBe(shapeId)
    })

    it('clears station selection when selecting a shape', () => {
        const { result } = renderHook(() => useCanvasSelection())
        const stationIds = Object.keys(useEditorStore.getState().stations)
        const shapeId = Object.keys(useEditorStore.getState().shapes)[0]

        act(() => result.current.setSelectedStationIds(stationIds))
        act(() => result.current.selectShape(shapeId))

        expect(result.current.selectedStationIds).toEqual([])
        expect(result.current.selectedShapeId).toBe(shapeId)
    })
})
