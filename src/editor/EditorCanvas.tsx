import { useEffect, useRef, useState } from 'react'
import { screenToWorld } from '../viewport/coordinates'
import type { Point } from '../types/geometry'

import { useEditorStore } from '../store/editorStore'
import { snapPointToGrid } from '../geometry/snap'
import { snapPointToOctolinear, findLineIntersection } from '../geometry/octolinear'
import { processSVGForExport } from '../utils/svgExport'

import { GridLayer } from '../renderer/GridLayer'
import { SegmentLayer } from '../renderer/SegmentLayer'
import { BendPointRenderer } from '../renderer/BendPointRenderer'
import { PreviewLine } from '../renderer/PreviewLine'
import { StationRenderer } from '../renderer/StationRenderer'

import { EditorToolbar } from './EditorToolbar'

import './EditorCanvas.css'

// Constants for magic numbers
const EXPORT_PADDING = 40
const BACKGROUND_IMAGE_SIZE = 4000
const BACKGROUND_IMAGE_OFFSET = 0

export function EditorCanvas() {
    const activeTool = useEditorStore((s) => s.activeTool)
    const setActiveTool = useEditorStore((s) => s.setActiveTool)
    const stations = useEditorStore((s) => s.stations)
    const segments = useEditorStore((s) => s.segments)
    const lines = useEditorStore((s) => s.lines)
    const addStation = useEditorStore((s) => s.addStation)
    const moveStation = useEditorStore(
        (s) => s.moveStation
    )

    const viewport = useEditorStore((s) => s.viewport)
    const setViewport = useEditorStore((s) => s.setViewport)
    const zoomInStore = useEditorStore((s) => s.zoomIn)
    const zoomOutStore = useEditorStore((s) => s.zoomOut)
    const resetViewport = useEditorStore((s) => s.resetViewport)
    const lineWidth = useEditorStore((s) => s.lineWidth)
    const setLineWidth = useEditorStore((s) => s.setLineWidth)
    const gridCellSize = useEditorStore((s) => s.gridCellSize)
    const gridCellsWidth = useEditorStore((s) => s.gridCellsWidth)
    const gridCellsHeight = useEditorStore((s) => s.gridCellsHeight)

    // Wrapper functions to zoom around the center of the SVG element
    const zoomIn = () => {
        const svg = svgRef.current
        if (!svg) {
            zoomInStore()
            return
        }
        const centerX = svg.clientWidth / 2
        const centerY = svg.clientHeight / 2
        zoomInStore(centerX, centerY)
    }

    const zoomOut = () => {
        const svg = svgRef.current
        if (!svg) {
            zoomOutStore()
            return
        }
        const centerX = svg.clientWidth / 2
        const centerY = svg.clientHeight / 2
        zoomOutStore(centerX, centerY)
    }

    const [pendingStationId, setPendingStationId] = useState<string | null>(null)

    const [selectedLineId, setSelectedLineId] = useState<string | null>(null)

    const [isCreatingLine, setIsCreatingLine] = useState(false)
    const [newLineName, setNewLineName] = useState('')
    const [newLineColor, setNewLineColor] = useState('#1976d2')

    const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
    const [showBackground, setShowBackground] = useState(true)

    const [showGridForExport, setShowGridForExport] = useState(true)

    const colorPalette = [
        '#e53935',
        '#ef5350',
        '#f44336',
        '#1e88e5',
        '#42a5f5',
        '#2196f3',
        '#43a047',
        '#66bb6a',
        '#4caf50',
        '#fdd835',
        '#ffee58',
        '#ffeb3b',
        '#fb8c00',
        '#ffa726',
        '#ff9800',
        '#8e24aa',
        '#ab47bc',
        '#9c27b0',
        '#d81b60',
        '#ec407a',
        '#e91e63',
        '#00acc1',
        '#26c6da',
        '#00bcd4',
        '#212121',
        '#424242',
        '#616161',
    ]

    const [pointerWorldPosition, setPointerWorldPosition] =
        useState<Point | null>(null)

    const [selectedStationId, setSelectedStationId] = useState<string | null>(null)

    const [draggingStationId, setDraggingStationId] =
        useState<string | null>(null)

    const [draggingBendPoint, setDraggingBendPoint] = useState<{
        segmentId: string
        pointIndex: number
    } | null>(null)

    const [isPanning, setIsPanning] =
        useState(false)

    const [spacePressed, setSpacePressed] =
        useState(false)

    const [lastPointer, setLastPointer] =
        useState({
            x: 0,
            y: 0,
        })

    const stationDragStartRef = useRef<{
        x: number
        y: number
    } | null>(null)

    const suppressNextClickRef = useRef(false)

    const svgRef = useRef<SVGSVGElement>(null)

    const addSegment = useEditorStore(
        (s) => s.addSegment
    )

    const deleteStation = useEditorStore(
        (s) => s.deleteStation
    )

    const setStationName = useEditorStore(
        (s) => s.setStationName
    )

    const updateSegmentPoint = useEditorStore(
        (s) => s.updateSegmentPoint
    )

    const addLine = useEditorStore((s) => s.addLine)

    const undo = useEditorStore((s) => s.undo)
    const redo = useEditorStore((s) => s.redo)
    const clear = useEditorStore((s) => s.clear)
    const pastStates = useEditorStore((s) => s.pastStates)
    const futureStates = useEditorStore((s) => s.futureStates)

    const exportAsSVG = () => {
        if (!svgRef.current) return

        // Hide grid during export
        setShowGridForExport(false)

        // Wait for re-render before exporting
        setTimeout(() => {
            const svgElement = svgRef.current
            if (!svgElement) {
                setShowGridForExport(true)
                return
            }

            const serializer = new XMLSerializer()
            const svgString = serializer.serializeToString(svgElement)

            // Get bounding box for viewBox calculation
            const bbox = svgElement.getBBox()

            // Process SVG for compatibility with external editors
            const processedSVG = processSVGForExport(svgString, bbox)

            const blob = new Blob([processedSVG], { type: 'image/svg+xml;charset=utf-8' })
            const url = URL.createObjectURL(blob)

            const link = document.createElement('a')
            link.href = url
            link.download = 'transit-map.svg'
            link.click()

            URL.revokeObjectURL(url)

            // Show grid again after export
            setShowGridForExport(true)
        }, 0)
    }

    const exportAsPNG = () => {
        if (!svgRef.current) return

        // Hide grid during export
        setShowGridForExport(false)

        // Wait for re-render before exporting
        setTimeout(() => {
            const svgElement = svgRef.current
            if (!svgElement) {
                setShowGridForExport(true)
                return
            }

            const serializer = new XMLSerializer()
            const svgString = serializer.serializeToString(svgElement)

            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
            const svgUrl = URL.createObjectURL(svgBlob)

            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                const bbox = svgElement.getBBox()

                canvas.width = bbox.width + EXPORT_PADDING * 2
                canvas.height = bbox.height + EXPORT_PADDING * 2

                const ctx = canvas.getContext('2d')
                if (ctx) {
                    ctx.fillStyle = '#ffffff'
                    ctx.fillRect(0, 0, canvas.width, canvas.height)
                    ctx.drawImage(img, -bbox.x + EXPORT_PADDING, -bbox.y + EXPORT_PADDING, bbox.width, bbox.height)

                    const pngUrl = canvas.toDataURL('image/png')
                    const link = document.createElement('a')
                    link.href = pngUrl
                    link.download = 'transit-map.png'
                    link.click()
                }

                URL.revokeObjectURL(svgUrl)

                // Show grid again after export
                setShowGridForExport(true)
            }
            img.src = svgUrl
        }, 0)
    }

    const pendingStation =
        pendingStationId
            ? stations[pendingStationId]
            : null

    const previewEndPoint =
        pendingStation && pointerWorldPosition
            ? snapPointToOctolinear(
                pendingStation,
                pointerWorldPosition
            )
            : null

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
                    // This gives us the point where lines from both stations at octolinear
                    // angles would meet, ensuring the bend point is valid for both directions
                    const intersection = findLineIntersection(fromStation, fromSnap, toStation, toSnap)
                    if (intersection) {
                        snappedPoint = intersection
                    } else {
                        // Fallback to grid snap if lines are parallel (e.g., both horizontal)
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
        if (stationIds.length > 1) { // Only snap if there are other stations
            // Find connected stations (stations that share a segment with this one)
            const connectedStations = Object.values(segments)
                .filter(seg => seg.fromStationId === draggingStationId || seg.toStationId === draggingStationId)
                .map(seg => seg.fromStationId === draggingStationId ? stations[seg.toStationId] : stations[seg.fromStationId])
                .filter(s => s !== undefined)

            if (connectedStations.length > 0) {
                // Snap to octolinear from the first connected station
                snapped = snapPointToOctolinear(connectedStations[0], gridSnapped)
            }
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
            if (nearestStation && nearestDist < 500) { // Only snap if within reasonable distance
                snapped = snapPointToOctolinear(nearestStation, gridSnapped)
            }
        }

        addStation(snapped.x, snapped.y)
    }

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setSpacePressed(true)
            }
            if ((e.code === 'Delete' || e.code === 'Backspace') && selectedStationId && !spacePressed) {
                e.preventDefault()
                deleteStation(selectedStationId)
                setSelectedStationId(null)
            }
        }

        const up = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setSpacePressed(false)
            }
        }

        window.addEventListener('keydown', down)
        window.addEventListener('keyup', up)

        return () => {
            window.removeEventListener('keydown', down)
            window.removeEventListener('keyup', up)
        }
    }, [selectedStationId, spacePressed, deleteStation])

    return (
        <div className="editor-canvas">
            <EditorToolbar
                activeTool={activeTool}
                setActiveTool={setActiveTool}
                undo={undo}
                redo={redo}
                canUndo={pastStates.length > 0}
                canRedo={futureStates.length > 0}
                exportAsSVG={exportAsSVG}
                exportAsPNG={exportAsPNG}
                clear={clear}
                setSelectedLineId={setSelectedLineId}
                setBackgroundImage={setBackgroundImage}
                backgroundImage={backgroundImage}
                showBackground={showBackground}
                setShowBackground={setShowBackground}
                gridCellsWidth={gridCellsWidth}
                setGridCellsWidth={useEditorStore((s) => s.setGridCellsWidth)}
                gridCellsHeight={gridCellsHeight}
                setGridCellsHeight={useEditorStore((s) => s.setGridCellsHeight)}
                lineWidth={lineWidth}
                setLineWidth={setLineWidth}
                selectedLineId={selectedLineId}
                lines={lines}
                isCreatingLine={isCreatingLine}
                setIsCreatingLine={setIsCreatingLine}
                newLineName={newLineName}
                setNewLineName={setNewLineName}
                newLineColor={newLineColor}
                setNewLineColor={setNewLineColor}
                addLine={addLine}
                setPendingStationId={setPendingStationId}
                setPointerWorldPosition={setPointerWorldPosition}
                colorPalette={colorPalette}
                zoomIn={zoomIn}
                zoomOut={zoomOut}
                resetViewport={resetViewport}
            />

            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                style={{
                    cursor: isPanning
                        ? 'grabbing'
                        : spacePressed
                            ? 'grab'
                            : 'default',
                }}
                onWheel={handleWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onClick={handleClick}
            >
                <rect
                    width="100%"
                    height="100%"
                    fill="#f5f5f5"
                />

                <g
                    transform={`
            translate(${viewport.offsetX} ${viewport.offsetY})
            scale(${viewport.zoom})
          `}
                >
                    {backgroundImage && showBackground && (
                        <image
                            href={backgroundImage}
                            x={BACKGROUND_IMAGE_OFFSET}
                            y={BACKGROUND_IMAGE_OFFSET}
                            width={BACKGROUND_IMAGE_SIZE}
                            height={BACKGROUND_IMAGE_SIZE}
                            opacity={0.3}
                            style={{
                                pointerEvents: 'none',
                            }}
                        />
                    )}

                    <GridLayer
                        gridCellSize={gridCellSize}
                        gridCellsWidth={gridCellsWidth}
                        gridCellsHeight={gridCellsHeight}
                        showGrid={showGridForExport}
                        zoom={viewport.zoom}
                        offsetX={viewport.offsetX}
                        offsetY={viewport.offsetY}
                    />

                    <SegmentLayer
                        segments={Object.values(segments)}
                        lineWidth={lineWidth}
                    />

                    {activeTool === 'select' && (
                        <BendPointRenderer
                            segments={Object.values(segments)}
                            onBendPointDragStart={(segmentId, pointIndex) => {
                                setDraggingBendPoint({ segmentId, pointIndex })
                            }}
                        />
                    )}

                    {activeTool === 'segment' &&
                        pendingStation &&
                        previewEndPoint &&
                        selectedLineId && (
                            <PreviewLine
                                fromStation={pendingStation}
                                toPoint={previewEndPoint}
                                lineColor={lines[selectedLineId]?.color || '#1976d2'}
                            />
                        )}

                    <StationRenderer
                        stations={stations}
                        activeTool={activeTool}
                        selectedStationId={selectedStationId}
                        pendingStationId={pendingStationId}
                        onStationPointerDown={(stationId, event) => {
                            event.stopPropagation()

                            if (activeTool === 'segment') {
                                if (pendingStationId) {
                                    if (pendingStationId !== stationId) {
                                        if (selectedLineId) {
                                            addSegment(
                                                pendingStationId,
                                                stationId,
                                                selectedLineId
                                            )
                                        }
                                    }

                                    setPendingStationId(null)
                                    setPointerWorldPosition(null)
                                } else {
                                    setPendingStationId(stationId)
                                }

                                return
                            }

                            if (activeTool !== 'select') {
                                return
                            }

                            setSelectedStationId(stationId)
                            setDraggingStationId(stationId)
                            stationDragStartRef.current = {
                                x: event.clientX,
                                y: event.clientY,
                            }
                        }}
                        onStationDoubleClick={(stationId) => {
                            if (activeTool !== 'select') {
                                return
                            }

                            const station = stations[stationId]
                            const newName = window.prompt(
                                'Station name:',
                                station?.name || ''
                            )

                            if (newName !== null) {
                                setStationName(stationId, newName)
                            }
                        }}
                    />
                </g>
            </svg>
        </div>
    )
}
