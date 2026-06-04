import { useRef, useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import { screenToWorld } from '../viewport/coordinates'
import { snapPointToGrid } from '../geometry/snap'
import { snapPointToOctolinear, findLineIntersection } from '../geometry/octolinear'
import { isPointInsideStation } from '../utils/stationUtils'
import { isPointInRect, isRectIntersectingPolyline, isPointInPolygon } from '../geometry/distance'
import type { Point } from '../types/geometry'

type Args = {
    spacePressed: boolean
    selectedStationIds: string[]
    selectedShapeId: string | null
    setSelectedStationIds: (ids: string[] | ((prev: string[]) => string[])) => void
    setSelectedShapeId: (id: string | null) => void
    setSelectedSegmentIds: (ids: string[] | ((prev: string[]) => string[])) => void
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
export function useCanvasInteractions({
    spacePressed,
    selectedStationIds,
    selectedShapeId: _selectedShapeId,
    setSelectedStationIds,
    setSelectedShapeId,
    setSelectedSegmentIds,
}: Args) {
    const stations = useEditorStore((s) => s.stations)
    const segments = useEditorStore((s) => s.segments)
    const setViewport = useEditorStore((s) => s.setViewport)
    const gridCellSize = useEditorStore((s) => s.gridCellSize)
    const gridCellsWidth = useEditorStore((s) => s.gridCellsWidth)
    const gridCellsHeight = useEditorStore((s) => s.gridCellsHeight)
    const activeTool = useEditorStore((s) => s.activeTool)
    const addStation = useEditorStore((s) => s.addStation)
    const moveStation = useEditorStore((s) => s.moveStation)
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

    // Rectangle selection state
    const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
    const [isRectangleSelecting, setIsRectangleSelecting] = useState(false)
    const rectSelectStartRef = useRef<Point | null>(null)

    const stationDragStartRef = useRef<{ x: number; y: number } | null>(null)
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

    const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
        event.currentTarget.setPointerCapture(event.pointerId)

        activePointersRef.current.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
        })

        if (activePointersRef.current.size === 2) {
            const pointers = Array.from(activePointersRef.current.values())
            const dx = pointers[1].x - pointers[0].x
            const dy = pointers[1].y - pointers[0].y
            previousPinchRef.current = {
                centerX: (pointers[0].x + pointers[1].x) / 2,
                centerY: (pointers[0].y + pointers[1].y) / 2,
                distance: Math.hypot(dx, dy),
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
            return
        }

        // Start rectangle selection when clicking empty canvas in select tool
        if (activeTool === 'select' && !draggingStationId && !draggingBendPoint) {
            const currentViewport = useEditorStore.getState().viewport
            const rect = event.currentTarget.getBoundingClientRect()
            const x = event.clientX - rect.left
            const y = event.clientY - rect.top
            const world = screenToWorld(x, y, currentViewport)
            rectSelectStartRef.current = world
            setSelectionRect({ x: world.x, y: world.y, width: 0, height: 0 })
            setIsRectangleSelecting(true)
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
            const dx = pointers[1].x - pointers[0].x
            const dy = pointers[1].y - pointers[0].y
            const newDistance = Math.hypot(dx, dy)
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
                    snappedPoint.y
                )
            }
            return
        }

        if (isRectangleSelecting && rectSelectStartRef.current) {
            const x1 = Math.min(rectSelectStartRef.current.x, point.x)
            const y1 = Math.min(rectSelectStartRef.current.y, point.y)
            const x2 = Math.max(rectSelectStartRef.current.x, point.x)
            const y2 = Math.max(rectSelectStartRef.current.y, point.y)
            setSelectionRect({ x: x1, y: y1, width: x2 - x1, height: y2 - y1 })
            return
        }

        if (!draggingStationId) return

        if (stationDragStartRef.current) {
            const dx = event.clientX - stationDragStartRef.current.x
            const dy = event.clientY - stationDragStartRef.current.y

            if (Math.hypot(dx, dy) > 3) {
                suppressNextClickRef.current = true
            }
        }

        const gridSnapped = snapPointToGrid(point.x, point.y, gridCellSize)

        // Determine if this is a group drag
        const isGroupDrag = selectedStationIds.includes(draggingStationId) && selectedStationIds.length > 1
        const idsToMove = isGroupDrag ? selectedStationIds : [draggingStationId]

        if (isGroupDrag) {
            // Compute group delta once from the dragged station, then apply uniformly.
            const draggedStation = stations[draggingStationId]
            if (!draggedStation) return

            // Clamp the dragged station's intended target to grid bounds and grid
            const draggedTarget = clampToGridBounds(gridSnapped)
            const dx = draggedTarget.x - draggedStation.x
            const dy = draggedTarget.y - draggedStation.y
            if (dx === 0 && dy === 0) return

            // Build target positions for every selected station, clamped to bounds.
            const targets: Record<string, { x: number; y: number }> = {}
            for (const id of idsToMove) {
                const s = stations[id]
                if (!s) continue
                const t = clampToGridBounds(
                    snapPointToGrid(s.x + dx, s.y + dy, gridCellSize)
                )
                targets[id] = t
            }

            // Reject the whole frame if any selected station would collide with a
            // non-selected station at its target. Other selected stations are
            // ignored because they are also moving.
            const selectedSet = new Set(idsToMove)
            const otherStations: Record<string, typeof stations[string]> = {}
            for (const [sid, s] of Object.entries(stations)) {
                if (!selectedSet.has(sid)) otherStations[sid] = s
            }
            for (const id of idsToMove) {
                const t = targets[id]
                if (!t) continue
                if (isPointInsideStation(t.x, t.y, otherStations)) {
                    return
                }
            }

            for (const id of idsToMove) {
                const t = targets[id]
                if (!t) continue
                moveStation(id, t.x, t.y)
            }
            return
        }

        // Single-station drag
        let snapped = gridSnapped

        // Snap to octolinear angles from connected stations
        const stationIdsAll = Object.keys(stations)
        if (stationIdsAll.length > 1) {
            const connectedStations = Object.values(segments)
                .filter(seg => seg.fromStationId === draggingStationId || seg.toStationId === draggingStationId)
                .map(seg => seg.fromStationId === draggingStationId ? stations[seg.toStationId] : stations[seg.fromStationId])
                .filter(s => s !== undefined)

            if (connectedStations.length > 0) {
                const octoSnapped = snapPointToOctolinear(connectedStations[0], gridSnapped)
                snapped = snapPointToGrid(octoSnapped.x, octoSnapped.y, gridCellSize)
            }
        }

        snapped = clampToGridBounds(snapped)

        if (isPointInsideStation(snapped.x, snapped.y, stations, draggingStationId)) {
            return
        }

        moveStation(draggingStationId, snapped.x, snapped.y)
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

            // Finalize rectangle selection
            if (isRectangleSelecting && selectionRect) {
                const minSize = 5 // threshold to distinguish click from drag
                if (Math.abs(selectionRect.width) > minSize || Math.abs(selectionRect.height) > minSize) {
                    const shapes = useEditorStore.getState().shapes
                    const segments = useEditorStore.getState().segments
                    const rect = {
                        minX: selectionRect.x,
                        minY: selectionRect.y,
                        maxX: selectionRect.x + selectionRect.width,
                        maxY: selectionRect.y + selectionRect.height,
                    }

                    const stationIds: string[] = []
                    for (const station of Object.values(stations)) {
                        if (isPointInRect(station, rect)) {
                            stationIds.push(station.id)
                        }
                    }

                    const shapeIds: string[] = []
                    for (const shape of Object.values(shapes)) {
                        if (isPointInPolygon({ x: rect.minX, y: rect.minY }, shape.points) ||
                            isPointInPolygon({ x: rect.maxX, y: rect.minY }, shape.points) ||
                            isPointInPolygon({ x: rect.maxX, y: rect.maxY }, shape.points) ||
                            isPointInPolygon({ x: rect.minX, y: rect.maxY }, shape.points) ||
                            shape.points.some((p) => isPointInRect(p, rect))) {
                            shapeIds.push(shape.id)
                        }
                    }

                    const segmentIds: string[] = []
                    for (const segment of Object.values(segments)) {
                        if (isRectIntersectingPolyline(rect, segment.points)) {
                            segmentIds.push(segment.id)
                        }
                    }

                    if (event.shiftKey) {
                        setSelectedStationIds((prev) => Array.from(new Set([...prev, ...stationIds])))
                        setSelectedSegmentIds((prev) => Array.from(new Set([...prev, ...segmentIds])))
                        if (shapeIds.length > 0) {
                            setSelectedShapeId(shapeIds[0])
                        }
                    } else {
                        setSelectedStationIds(stationIds)
                        setSelectedSegmentIds(segmentIds)
                        setSelectedShapeId(shapeIds.length > 0 ? shapeIds[0] : null)
                    }
                }
                suppressNextClickRef.current = true
            }

            setDraggingStationId(null)
            stationDragStartRef.current = null
            setDraggingBendPoint(null)
            setIsPanning(false)
            setIsRectangleSelecting(false)
            setSelectionRect(null)
            rectSelectStartRef.current = null
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
        const gridSnapped = snapPointToGrid(point.x, point.y, gridCellSize)

        // Snap to octolinear angle from nearest station if any exist
        const stationIds = Object.keys(stations)
        let snapped = gridSnapped
        if (stationIds.length > 0) {
            // Find nearest station
            let nearestStation: { x: number; y: number } | null = null
            let nearestDist = Infinity
            for (const stationId of stationIds) {
                const station = stations[stationId]
                const dist = Math.hypot(station.x - gridSnapped.x, station.y - gridSnapped.y)
                if (dist < nearestDist) {
                    nearestDist = dist
                    nearestStation = station
                }
            }
            if (nearestStation && nearestDist < 500) {
                // Snap octolinear, then re-snap to grid so the final position is a grid intersection
                const octoSnapped = snapPointToOctolinear(nearestStation, gridSnapped)
                snapped = snapPointToGrid(octoSnapped.x, octoSnapped.y, gridCellSize)
            }
        }

        // Clamp click position to the grid area so stations always land inside
        snapped = clampToGridBounds(snapped)

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
        selectionRect,
        isRectangleSelecting,
    }
}
