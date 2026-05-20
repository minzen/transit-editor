import { useRef, useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import { screenToWorld } from '../viewport/coordinates'
import { snapPointToGrid } from '../geometry/snap'
import { snapPointToOctolinear, findLineIntersection } from '../geometry/octolinear'
import { isPointInsideStation } from '../utils/stationUtils'
import type { Point } from '../types/geometry'

type Args = {
    spacePressed: boolean
}

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
export function useCanvasInteractions({ spacePressed }: Args) {
    const stations = useEditorStore((s) => s.stations)
    const segments = useEditorStore((s) => s.segments)
    const viewport = useEditorStore((s) => s.viewport)
    const setViewport = useEditorStore((s) => s.setViewport)
    const gridCellSize = useEditorStore((s) => s.gridCellSize)
    const activeTool = useEditorStore((s) => s.activeTool)
    const addStation = useEditorStore((s) => s.addStation)
    const moveStation = useEditorStore((s) => s.moveStation)
    const updateSegmentPoint = useEditorStore((s) => s.updateSegmentPoint)

    const [pointerWorldPosition, setPointerWorldPosition] = useState<Point | null>(null)
    const [draggingStationId, setDraggingStationId] = useState<string | null>(null)
    const [draggingBendPoint, setDraggingBendPoint] = useState<{
        segmentId: string
        pointIndex: number
    } | null>(null)
    const [isPanning, setIsPanning] = useState(false)
    const [lastPointer, setLastPointer] = useState({ x: 0, y: 0 })

    const stationDragStartRef = useRef<{ x: number; y: number } | null>(null)
    const suppressNextClickRef = useRef(false)

    const handleWheel = (event: React.WheelEvent<SVGSVGElement>) => {
        event.preventDefault()

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
        if (spacePressed) {
            setIsPanning(true)
            setLastPointer({
                x: event.clientX,
                y: event.clientY,
            })
        }
    }

    const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
        if (isPanning) {
            const dx = event.clientX - lastPointer.x
            const dy = event.clientY - lastPointer.y

            setViewport({
                ...viewport,
                offsetX: viewport.offsetX + dx,
                offsetY: viewport.offsetY + dy,
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

        if (!draggingStationId) return

        if (stationDragStartRef.current) {
            const dx = event.clientX - stationDragStartRef.current.x
            const dy = event.clientY - stationDragStartRef.current.y

            if (Math.hypot(dx, dy) > 3) {
                suppressNextClickRef.current = true
            }
        }

        const gridSnapped = snapPointToGrid(point.x, point.y, gridCellSize)

        // Snap to octolinear angles from connected stations
        const stationIds = Object.keys(stations)
        let snapped = gridSnapped
        if (stationIds.length > 1) {
            const connectedStations = Object.values(segments)
                .filter(seg => seg.fromStationId === draggingStationId || seg.toStationId === draggingStationId)
                .map(seg => seg.fromStationId === draggingStationId ? stations[seg.toStationId] : stations[seg.fromStationId])
                .filter(s => s !== undefined)

            if (connectedStations.length > 0) {
                // Snap to octolinear from the first connected station, then re-snap to grid
                // so the final position always lands on a grid intersection
                const octoSnapped = snapPointToOctolinear(connectedStations[0], gridSnapped)
                snapped = snapPointToGrid(octoSnapped.x, octoSnapped.y, gridCellSize)
            }
        }

        // Prevent moving station inside another station
        if (isPointInsideStation(snapped.x, snapped.y, stations, draggingStationId)) {
            return
        }

        moveStation(draggingStationId, snapped.x, snapped.y)
    }

    const handlePointerUp = () => {
        setDraggingStationId(null)
        stationDragStartRef.current = null
        setDraggingBendPoint(null)
        setIsPanning(false)
    }

    const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
        if (spacePressed) return
        if (activeTool !== 'station') return

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

        // Prevent placing station inside another station
        if (isPointInsideStation(snapped.x, snapped.y, stations)) {
            return
        }

        addStation(snapped.x, snapped.y)
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
        handleClick,
    }
}
