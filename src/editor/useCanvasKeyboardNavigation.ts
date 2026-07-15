import { useState, useCallback, useEffect } from 'react'
import { useEditorStore } from '../store/editorStore'
import { screenToWorld } from '../viewport/coordinates'
import { snapPointToGrid } from '../geometry/snap'
import { isPointInPolygon } from '../geometry/distance'
import type { Point } from '../types/geometry'
import type { Station } from '../model/station'

type Options = {
    svgRef: React.RefObject<SVGSVGElement | null>
    selectedStationIds: string[]
    setSelectedStationIds: (ids: string[]) => void
    selectedShapeIds: string[]
    setSelectedShapeIds: (ids: string[]) => void
    shapePoints: Point[]
    setShapePoints: React.Dispatch<React.SetStateAction<Point[]>>
    selectedLineId: string | null
    pendingStationId: string | null
    setPendingStationId: (id: string | null) => void
    setPointerWorldPosition: (pos: Point | null) => void
    setStationNameDialogOpen: (open: boolean) => void
    setPendingStationPosition: (pos: Point | null) => void
    onKeyboardCursorShown?: () => void
}

export function useCanvasKeyboardNavigation({
    svgRef,
    selectedStationIds,
    setSelectedStationIds,
    selectedShapeIds,
    setSelectedShapeIds,
    shapePoints,
    setShapePoints,
    selectedLineId,
    pendingStationId,
    setPendingStationId,
    setPointerWorldPosition,
    setStationNameDialogOpen,
    setPendingStationPosition,
    onKeyboardCursorShown,
}: Options) {
    const [keyboardCursor, setKeyboardCursor] = useState<Point>({ x: 0, y: 0 })

    const stations = useEditorStore((s) => s.stations)
    const shapes = useEditorStore((s) => s.shapes)
    const gridCellSize = useEditorStore((s) => s.gridCellSize)
    const gridCellsWidth = useEditorStore((s) => s.gridCellsWidth)
    const gridCellsHeight = useEditorStore((s) => s.gridCellsHeight)
    const activeTool = useEditorStore((s) => s.activeTool)
    const translateSelection = useEditorStore((s) => s.translateSelection)
    const addSegment = useEditorStore((s) => s.addSegment)
    const addShape = useEditorStore((s) => s.addShape)

    const worldWidth = gridCellsWidth * gridCellSize
    const worldHeight = gridCellsHeight * gridCellSize

    // Initialize cursor at viewport center when SVG is available
    useEffect(() => {
        const svg = svgRef.current
        if (!svg) return

        const rect = svg.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) return

        const viewport = useEditorStore.getState().viewport
        const world = screenToWorld(rect.width / 2, rect.height / 2, viewport)
        const snapped = snapPointToGrid(world.x, world.y, gridCellSize)
        setKeyboardCursor({
            x: Math.max(0, Math.min(worldWidth, snapped.x)),
            y: Math.max(0, Math.min(worldHeight, snapped.y)),
        })
    }, [svgRef, gridCellSize, worldWidth, worldHeight])

    const clampToGrid = useCallback(
        (point: Point): Point => ({
            x: Math.max(0, Math.min(worldWidth, point.x)),
            y: Math.max(0, Math.min(worldHeight, point.y)),
        }),
        [worldWidth, worldHeight]
    )

    const findNearestStation = useCallback(
        (cursor: Point): Station | null => {
            let nearest: Station | null = null
            let minDist = Infinity
            for (const station of Object.values(stations)) {
                const dist = Math.hypot(station.x - cursor.x, station.y - cursor.y)
                if (dist < minDist) {
                    minDist = dist
                    nearest = station
                }
            }
            return nearest
        },
        [stations]
    )

    const cycleStations = useCallback(
        (direction: 'next' | 'prev') => {
            const stationList = Object.values(stations)
            if (stationList.length === 0) return

            const sorted = [...stationList].sort((a, b) => {
                if (a.y !== b.y) return a.y - b.y
                return a.x - b.x
            })

            let currentIndex = -1
            if (selectedStationIds.length > 0) {
                currentIndex = sorted.findIndex((s) => s.id === selectedStationIds[0])
            }

            let nextIndex: number
            if (direction === 'next') {
                nextIndex = (currentIndex + 1) % sorted.length
            } else {
                nextIndex = (currentIndex - 1 + sorted.length) % sorted.length
            }

            setSelectedStationIds([sorted[nextIndex].id])
            setSelectedShapeIds([])
            setKeyboardCursor({ x: sorted[nextIndex].x, y: sorted[nextIndex].y })
        },
        [stations, selectedStationIds, setSelectedStationIds, setSelectedShapeIds]
    )

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<SVGSVGElement>) => {
            const step = event.shiftKey ? gridCellSize * 10 : gridCellSize

            if (
                event.key === 'ArrowUp' ||
                event.key === 'ArrowDown' ||
                event.key === 'ArrowLeft' ||
                event.key === 'ArrowRight'
            ) {
                event.preventDefault()
                event.stopPropagation()
                onKeyboardCursorShown?.()

                let dx = 0
                let dy = 0
                if (event.key === 'ArrowUp') dy = -step
                if (event.key === 'ArrowDown') dy = step
                if (event.key === 'ArrowLeft') dx = -step
                if (event.key === 'ArrowRight') dx = step

                if (selectedStationIds.length > 0 || selectedShapeIds.length > 0) {
                    translateSelection(selectedStationIds, selectedShapeIds, dx, dy)
                    const first = useEditorStore.getState().stations[selectedStationIds[0]]
                    if (first) setKeyboardCursor({ x: first.x, y: first.y })
                } else {
                    setKeyboardCursor((prev) => {
                        const clamped = clampToGrid({ x: prev.x + dx, y: prev.y + dy })
                        return snapPointToGrid(clamped.x, clamped.y, gridCellSize)
                    })
                }
                return
            }

            if (event.key === 'Tab') {
                event.preventDefault()
                event.stopPropagation()
                cycleStations(event.shiftKey ? 'prev' : 'next')
                return
            }

            if (event.key === 'Enter') {
                event.preventDefault()
                event.stopPropagation()

                if (activeTool === 'station') {
                    const snapped = snapPointToGrid(keyboardCursor.x, keyboardCursor.y, gridCellSize)
                    const clamped = clampToGrid(snapped)
                    setPendingStationPosition(clamped)
                    setStationNameDialogOpen(true)
                    return
                }

                if (activeTool === 'segment') {
                    const nearest = findNearestStation(keyboardCursor)
                    if (!nearest) return

                    if (pendingStationId) {
                        if (pendingStationId !== nearest.id && selectedLineId) {
                            addSegment(pendingStationId, nearest.id, selectedLineId)
                        }
                        setPendingStationId(null)
                        setPointerWorldPosition(null)
                    } else {
                        setPendingStationId(nearest.id)
                        setPointerWorldPosition(keyboardCursor)
                    }
                    return
                }

                if (activeTool === 'shape') {
                    if (event.shiftKey && shapePoints.length >= 3) {
                        addShape(shapePoints, '#a8d5e2')
                        setShapePoints([])
                    } else {
                        const snapped = snapPointToGrid(keyboardCursor.x, keyboardCursor.y, gridCellSize)
                        const clamped = clampToGrid(snapped)
                        setShapePoints((prev) => [...prev, clamped])
                    }
                    return
                }

                if (activeTool === 'select') {
                    const nearest = findNearestStation(keyboardCursor)
                    if (nearest) {
                        setSelectedStationIds([nearest.id])
                        setSelectedShapeIds([])
                        setKeyboardCursor({ x: nearest.x, y: nearest.y })
                        return
                    }
                    for (const shape of Object.values(shapes)) {
                        if (isPointInPolygon(keyboardCursor, shape.points)) {
                            setSelectedShapeIds([shape.id])
                            setSelectedStationIds([])
                            return
                        }
                    }
                }

                return
            }

            if (event.key === 'Escape') {
                event.preventDefault()
                event.stopPropagation()

                if (shapePoints.length > 0) {
                    setShapePoints(() => [])
                }
                if (selectedShapeIds.length > 0) {
                    setSelectedShapeIds([])
                }
                if (selectedStationIds.length > 0) {
                    setSelectedStationIds([])
                }
            }
        },
        [
            gridCellSize,
            selectedStationIds,
            shapes,
            selectedShapeIds,
            translateSelection,
            shapePoints,
            setShapePoints,
            keyboardCursor,
            activeTool,
            findNearestStation,
            clampToGrid,
            cycleStations,
            pendingStationId,
            selectedLineId,
            setPendingStationId,
            setPointerWorldPosition,
            addSegment,
            setSelectedStationIds,
            setSelectedShapeIds,
            setPendingStationPosition,
            setStationNameDialogOpen,
            addShape,
            onKeyboardCursorShown,
        ]
    )

    return { keyboardCursor, handleKeyDown }
}
