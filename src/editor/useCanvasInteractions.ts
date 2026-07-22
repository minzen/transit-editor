import { useRef, useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import { screenToWorld } from '../viewport/coordinates'
import { snapPointToGrid } from '../geometry/snap'
import { snapPointToOctolinear, findLineIntersection } from '../geometry/octolinear'
import { isPointInsideStation } from '../utils/stationUtils'
import { distance } from '../geometry/vector'
import type { Point } from '../types/geometry'
import type { DataSnapshot } from '../store/slices/dataSlice'

type Args = {
    spacePressed: boolean
    selectedStationIds: string[]
    selectedShapeIds: string[]
}

// Margin (in screen pixels) of the grid that must remain visible when panning,
// so the user cannot accidentally pan the grid completely off-screen.
const PAN_VISIBILITY_MARGIN = 100

const clamp = (value: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, value))

/**
 * Encapsulates the SVG canvas pointer/wheel/click event handlers and the
 * interaction state they share (panning, dragging stations, dragging bend
 * points, current world-space pointer position, and refs used to suppress
 * clicks after drags).
 *
 * The hook reads stations/segments/viewport from the store and exposes setters
 * for drag-related state so child renderers (StationRenderer, BendPointRenderer)
 * can initiate drags from their own pointerDown callbacks.
 */
export function useCanvasInteractions({ spacePressed, selectedStationIds, selectedShapeIds }: Args) {
    const stations = useEditorStore((s) => s.stations)
    const segments = useEditorStore((s) => s.segments)
    const setViewport = useEditorStore((s) => s.setViewport)
    const gridCellSize = useEditorStore((s) => s.gridCellSize)
    const gridCellsWidth = useEditorStore((s) => s.gridCellsWidth)
    const gridCellsHeight = useEditorStore((s) => s.gridCellsHeight)
    const activeTool = useEditorStore((s) => s.activeTool)
    const addStation = useEditorStore((s) => s.addStation)
    const translateSelection = useEditorStore((s) => s.translateSelection)
    const updateSegmentPoint = useEditorStore((s) => s.updateSegmentPoint)

    const [stationNameDialogOpen, setStationNameDialogOpen] = useState(false)
    const [pendingStationPosition, setPendingStationPosition] = useState<{ x: number; y: number } | null>(null)

    const worldWidth = gridCellsWidth * gridCellSize
    const worldHeight = gridCellsHeight * gridCellSize

    const clampToGridBounds = (point: { x: number; y: number }) => ({
        x: clamp(point.x, 0, worldWidth),
        y: clamp(point.y, 0, worldHeight),
    })

    const clampPanOffset = (
        offsetX: number,
        offsetY: number,
        svgWidth: number,
        svgHeight: number,
        zoom: number
    ) => ({
        offsetX: clamp(
            offsetX,
            PAN_VISIBILITY_MARGIN - worldWidth * zoom,
            svgWidth - PAN_VISIBILITY_MARGIN
        ),
        offsetY: clamp(
            offsetY,
            PAN_VISIBILITY_MARGIN - worldHeight * zoom,
            svgHeight - PAN_VISIBILITY_MARGIN
        ),
    })

    const [pointerWorldPosition, setPointerWorldPosition] = useState<Point | null>(null)
    const [draggingStationId, setDraggingStationId] = useState<string | null>(null)
    const [draggingBendPoint, setDraggingBendPoint] = useState<{
        segmentId: string
        pointIndex: number
    } | null>(null)
    const [isPanning, setIsPanning] = useState(false)
    const [lastPointer, setLastPointer] = useState({ x: 0, y: 0 })

    const stationDragStartRef = useRef<{ x: number; y: number } | null>(null)
    const lastStationDragPointRef = useRef<Point | null>(null)
    const dragHistoryStartRef = useRef<DataSnapshot | null>(null)
    const suppressNextClickRef = useRef(false)

    const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
    const previousPinchRef = useRef<{ centerX: number; centerY: number; distance: number } | null>(null)

    const handleWheel = (event: React.WheelEvent<SVGSVGElement>) => {
        event.preventDefault()
        const viewport = useEditorStore.getState().viewport

        const rect = event.currentTarget.getBoundingClientRect()

        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top

        const worldBefore = screenToWorld(mouseX, mouseY, viewport)

        const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
        const newZoom = viewport.zoom * zoomFactor

        const newOffsetX = mouseX - worldBefore.x * newZoom
        const newOffsetY = mouseY - worldBefore.y * newZoom

        setViewport({
            zoom: newZoom,
            offsetX: newOffsetX,
            offsetY: newOffsetY,
        })
    }

    const beginDragHistoryTransaction = () => {
        const state = useEditorStore.getState()
        dragHistoryStartRef.current = {
            stations: state.stations,
            segments: state.segments,
            lines: state.lines,
            shapes: state.shapes,
        }
    }

    const beginStationDrag = (stationId: string) => {
        const station = useEditorStore.getState().stations[stationId]
        lastStationDragPointRef.current = station ? { x: station.x, y: station.y } : null
    }

    const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
        event.currentTarget.setPointerCapture(event.pointerId)

        activePointersRef.current.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
        })

        if (activePointersRef.current.size === 2) {
            const pointers = Array.from(activePointersRef.current.values())
            previousPinchRef.current = {
                centerX: (pointers[0].x + pointers[1].x) / 2,
                centerY: (pointers[0].y + pointers[1].y) / 2,
                distance: distance(pointers[0], pointers[1]),
            }
            // Cancel single-pointer interactions so pinch doesn't fight them
            setIsPanning(false)
            setDraggingStationId(null)
            stationDragStartRef.current = null
            setDraggingBendPoint(null)
            return
        }

        if (spacePressed) {
            setIsPanning(true)
            setLastPointer({
                x: event.clientX,
                y: event.clientY,
            })
        }
    }

    const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
        const viewport = useEditorStore.getState().viewport
        if (activePointersRef.current.has(event.pointerId)) {
            activePointersRef.current.set(event.pointerId, {
                x: event.clientX,
                y: event.clientY,
            })
        }

        if (activePointersRef.current.size >= 2) {
            const pointers = Array.from(activePointersRef.current.values())
            const newDistance = distance(pointers[0], pointers[1])
            const newCenterX = (pointers[0].x + pointers[1].x) / 2
            const newCenterY = (pointers[0].y + pointers[1].y) / 2

            const prev = previousPinchRef.current
            if (prev && prev.distance > 0) {
                const zoomRatio = newDistance / prev.distance
                const oldZoom = viewport.zoom
                const newZoom = Math.min(10, Math.max(0.1, oldZoom * zoomRatio))

                const panDx = newCenterX - prev.centerX
                const panDy = newCenterY - prev.centerY

                const rect = event.currentTarget.getBoundingClientRect()
                const clamped = clampPanOffset(
                    viewport.offsetX + panDx,
                    viewport.offsetY + panDy,
                    rect.width,
                    rect.height,
                    newZoom
                )

                setViewport({
                    zoom: newZoom,
                    offsetX: clamped.offsetX,
                    offsetY: clamped.offsetY,
                })
            }

            previousPinchRef.current = {
                centerX: newCenterX,
                centerY: newCenterY,
                distance: newDistance,
            }
            return
        }

        if (isPanning) {
            const dx = event.clientX - lastPointer.x
            const dy = event.clientY - lastPointer.y

            const rect = event.currentTarget.getBoundingClientRect()
            const clamped = clampPanOffset(
                viewport.offsetX + dx,
                viewport.offsetY + dy,
                rect.width,
                rect.height,
                viewport.zoom
            )

            setViewport({
                ...viewport,
                offsetX: clamped.offsetX,
                offsetY: clamped.offsetY,
            })

            setLastPointer({
                x: event.clientX,
                y: event.clientY,
            })

            return
        }

        const rect = event.currentTarget.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top

        const point = screenToWorld(x, y, viewport)
        setPointerWorldPosition(point)

        if (draggingBendPoint) {
            const segment = segments[draggingBendPoint.segmentId]
            if (segment) {
                const fromStation = stations[segment.fromStationId]
                const toStation = stations[segment.toStationId]

                // First snap to grid, then to octolinear angles
                const gridSnapped = snapPointToGrid(point.x, point.y, gridCellSize)

                let snappedPoint: { x: number; y: number }

                if (fromStation && toStation) {
                    // Snap to the intersection of octolinear directions from both stations
                    // This ensures the bend point stays on valid octolinear paths (45°, 90°, etc.)
                    // relative to both stations, creating proper L-shaped or diagonal paths
                    const fromSnap = snapPointToOctolinear(fromStation, gridSnapped)
                    const toSnap = snapPointToOctolinear(toStation, gridSnapped)

                    // Find the intersection point of the two octolinear lines
                    const intersection = findLineIntersection(fromStation, fromSnap, toStation, toSnap)
                    if (intersection) {
                        snappedPoint = intersection
                    } else {
                        // Fallback to grid snap if lines are parallel
                        snappedPoint = gridSnapped
                    }
                } else {
                    snappedPoint = gridSnapped
                }

                updateSegmentPoint(
                    draggingBendPoint.segmentId,
                    draggingBendPoint.pointIndex,
                    snappedPoint.x,
                    snappedPoint.y,
                    false
                )
            }
            return
        }

        if (!draggingStationId) return

        if (stationDragStartRef.current) {
            const dragDelta = distance(
                { x: event.clientX, y: event.clientY },
                stationDragStartRef.current
            )

            if (dragDelta > 3) {
                suppressNextClickRef.current = true
            }
        }

        const snapped = snapPointToGrid(point.x, point.y, gridCellSize)
        const previousPoint = lastStationDragPointRef.current
        if (!previousPoint) {
            lastStationDragPointRef.current = snapped
            return
        }

        const dx = snapped.x - previousPoint.x
        const dy = snapped.y - previousPoint.y
        if (dx === 0 && dy === 0) return

        const stationsToMove = selectedStationIds.includes(draggingStationId)
            ? selectedStationIds
            : [draggingStationId]
        translateSelection(stationsToMove, selectedShapeIds, dx, dy, false)
        lastStationDragPointRef.current = snapped
    }

    const handlePointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
        const wasMultiTouch = previousPinchRef.current !== null

        try {
            event.currentTarget.releasePointerCapture(event.pointerId)
        } catch {
            // Pointer may have already been released (e.g. pointercancel)
        }
        activePointersRef.current.delete(event.pointerId)
        if (activePointersRef.current.size < 2) {
            previousPinchRef.current = null
        }

        if (activePointersRef.current.size === 0) {
            if (wasMultiTouch) {
                suppressNextClickRef.current = true
            }
            if (dragHistoryStartRef.current) {
                useEditorStore.getState().commitHistoryTransaction(dragHistoryStartRef.current)
                dragHistoryStartRef.current = null
            }
            setDraggingStationId(null)
            stationDragStartRef.current = null
            setDraggingBendPoint(null)
            setIsPanning(false)
        }
    }

    const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
        if (spacePressed) return
        if (activeTool !== 'station') return

        const viewport = useEditorStore.getState().viewport

        if (suppressNextClickRef.current) {
            suppressNextClickRef.current = false
            return
        }

        const rect = event.currentTarget.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top

        const point = screenToWorld(x, y, viewport)

        // Snap to grid, then clamp to grid bounds
        const snapped = clampToGridBounds(snapPointToGrid(point.x, point.y, gridCellSize))

        // Prevent placing station inside another station
        if (isPointInsideStation(snapped.x, snapped.y, stations)) {
            return
        }

        setPendingStationPosition(snapped)
        setStationNameDialogOpen(true)
    }

    const handleStationNameSave = (name: string) => {
        if (pendingStationPosition) {
            addStation(pendingStationPosition.x, pendingStationPosition.y, name)
        }
        setStationNameDialogOpen(false)
        setPendingStationPosition(null)
    }

    const handleStationNameCancel = () => {
        setStationNameDialogOpen(false)
        setPendingStationPosition(null)
    }

    return {
        pointerWorldPosition,
        setPointerWorldPosition,
        isPanning,
        draggingStationId,
        setDraggingStationId,
        draggingBendPoint,
        setDraggingBendPoint,
        stationDragStartRef,
        beginDragHistoryTransaction,
        beginStationDrag,
        suppressNextClickRef,
        handleWheel,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handlePointerCancel: handlePointerUp,
        handleClick,
        stationNameDialogOpen,
        setStationNameDialogOpen,
        handleStationNameSave,
        handleStationNameCancel,
        pendingStationPosition,
        setPendingStationPosition,
    }
}
