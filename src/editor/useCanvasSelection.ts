import { useCallback, useState } from 'react'
import { useEditorStore } from '../store/editorStore'

export function useCanvasSelection() {
    const stations = useEditorStore((state) => state.stations)
    const shapes = useEditorStore((state) => state.shapes)
    const deleteStation = useEditorStore((state) => state.deleteStation)
    const deleteShape = useEditorStore((state) => state.deleteShape)

    const [selectedStationIds, setSelectedStationIds] = useState<string[]>([])
    const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([])
    const selectedShapeId = selectedShapeIds[0] ?? null

    const setSelectedShapeId = useCallback((id: string | null) => {
        setSelectedShapeIds(id ? [id] : [])
    }, [])

    const selectShape = useCallback((shapeId: string) => {
        setSelectedShapeIds([shapeId])
        setSelectedStationIds([])
    }, [])

    const clearSelection = useCallback(() => {
        setSelectedStationIds([])
        setSelectedShapeIds([])
    }, [])

    const selectAll = useCallback(() => {
        setSelectedStationIds(Object.keys(stations))
        setSelectedShapeIds(Object.keys(shapes))
    }, [shapes, stations])

    const deleteSelected = useCallback(() => {
        for (const stationId of selectedStationIds) {
            deleteStation(stationId)
        }
        for (const shapeId of selectedShapeIds) {
            deleteShape(shapeId)
        }
        clearSelection()
    }, [clearSelection, deleteShape, deleteStation, selectedShapeIds, selectedStationIds])

    const removeStationFromSelection = useCallback((stationId: string) => {
        setSelectedStationIds((current) => current.filter((id) => id !== stationId))
    }, [])

    return {
        selectedStationIds,
        setSelectedStationIds,
        selectedShapeIds,
        setSelectedShapeIds,
        selectedShapeId,
        setSelectedShapeId,
        selectShape,
        clearSelection,
        selectAll,
        deleteSelected,
        removeStationFromSelection,
    }
}
