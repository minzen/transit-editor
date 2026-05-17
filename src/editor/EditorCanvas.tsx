import { useEffect, useRef, useState } from 'react'
import { screenToWorld } from '../viewport/coordinates'
import type { Point } from '../types/geometry'

import { useEditorStore } from '../store/editorStore'
import { snapPointToGrid } from '../geometry/snap'
import { snapPointToOctolinear } from '../geometry/octolinear'

import { GridLayer } from '../renderer/GridLayer'
import { SegmentLayer } from '../renderer/SegmentLayer'

import { EditorToolbar } from './EditorToolbar'

import './EditorCanvas.css'

// Constants for magic numbers
const EXPORT_PADDING = 40
const BEND_POINT_RADIUS = 6
const STATION_RADIUS = 8
const BACKGROUND_IMAGE_SIZE = 4000
const BACKGROUND_IMAGE_OFFSET = -2000
const GRID_SIZE = 4000

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
    const zoomIn = useEditorStore((s) => s.zoomIn)
    const zoomOut = useEditorStore((s) => s.zoomOut)
    const resetViewport = useEditorStore((s) => s.resetViewport)

    const [pendingStationId, setPendingStationId] = useState<string | null>(null)

    const [selectedLineId, setSelectedLineId] = useState<string | null>(null)

    const [isCreatingLine, setIsCreatingLine] = useState(false)
    const [newLineName, setNewLineName] = useState('')
    const [newLineColor, setNewLineColor] = useState('#1976d2')

    const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
    const [showBackground, setShowBackground] = useState(true)

    const [gridSize, setGridSize] = useState(40)
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

            const blob = new Blob([svgString], { type: 'image/svg+xml' })
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
                const bbox = svgElement.getBoundingClientRect()

                canvas.width = bbox.width + EXPORT_PADDING * 2
                canvas.height = bbox.height + EXPORT_PADDING * 2

                const ctx = canvas.getContext('2d')
                if (ctx) {
                    ctx.fillStyle = '#ffffff'
                    ctx.fillRect(0, 0, canvas.width, canvas.height)
                    ctx.drawImage(img, EXPORT_PADDING, EXPORT_PADDING, bbox.width, bbox.height)

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
                const gridSnapped = snapPointToGrid(point.x, point.y, gridSize)

                let snappedPoint: { x: number; y: number }

                if (fromStation && toStation) {
                    const fromSnap = snapPointToOctolinear(fromStation, gridSnapped)
                    const toSnap = snapPointToOctolinear(toStation, gridSnapped)

                    const fromDist = Math.hypot(fromSnap.x - gridSnapped.x, fromSnap.y - gridSnapped.y)
                    const toDist = Math.hypot(toSnap.x - gridSnapped.x, toSnap.y - gridSnapped.y)

                    snappedPoint = fromDist < toDist ? fromSnap : toSnap
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

        const snapped = snapPointToGrid(point.x, point.y, gridSize)
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
        const snapped = snapPointToGrid(point.x, point.y, gridSize)

        addStation(snapped.x, snapped.y)
    }

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setSpacePressed(true)
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
    }, [])

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
                gridSize={gridSize}
                setGridSize={setGridSize}
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
                        width={GRID_SIZE}
                        height={GRID_SIZE}
                        gridSize={gridSize}
                        showGrid={showGridForExport}
                    />

                    <SegmentLayer
                        segments={Object.values(segments)}
                    />

                    {activeTool === 'select' &&
                        Object.values(segments).map((segment) => {
                            if (segment.points.length === 3) {
                                const bendPoint = segment.points[1]
                                return (
                                    <circle
                                        key={`${segment.id}-bend`}
                                        cx={bendPoint.x}
                                        cy={bendPoint.y}
                                        r={BEND_POINT_RADIUS}
                                        fill="#1976d2"
                                        stroke="#fff"
                                        strokeWidth={2}
                                        style={{
                                            cursor: 'grab',
                                        }}
                                        onPointerDown={(event) => {
                                            event.stopPropagation()
                                            setDraggingBendPoint({
                                                segmentId: segment.id,
                                                pointIndex: 1,
                                            })
                                        }}
                                    />
                                )
                            }
                            return null
                        })}

                    {activeTool === 'segment' &&
                        pendingStation &&
                        previewEndPoint &&
                        selectedLineId && (
                            <line
                                x1={pendingStation.x}
                                y1={pendingStation.y}
                                x2={previewEndPoint.x}
                                y2={previewEndPoint.y}
                                stroke={lines[selectedLineId]?.color || '#1976d2'}
                                strokeWidth={6}
                                strokeLinecap="round"
                                strokeDasharray="12 12"
                                opacity={0.45}
                            />
                        )}

                    {Object.values(stations).map((s) => {
                        const isPendingStation =
                            activeTool === 'segment' &&
                            pendingStationId === s.id

                        return (
                            <g key={s.id}>
                                {isPendingStation && (
                                    <circle
                                        cx={s.x}
                                        cy={s.y}
                                        r={STATION_RADIUS + 6}
                                        fill="none"
                                        stroke="#1976d2"
                                        strokeWidth={4}
                                    />
                                )}

                                <circle
                                    cx={s.x}
                                    cy={s.y}
                                    r={STATION_RADIUS}
                                    fill="#111"
                                    style={{
                                        cursor: 'pointer',
                                    }}

                                    onPointerDown={(event) => {
                                        event.stopPropagation()

                                        if (activeTool === 'segment') {
                                            if (pendingStationId) {
                                                if (pendingStationId !== s.id) {
                                                    if (selectedLineId) {
                                                        addSegment(
                                                            pendingStationId,
                                                            s.id,
                                                            selectedLineId
                                                        )
                                                    }
                                                }

                                                setPendingStationId(null)
                                                setPointerWorldPosition(null)
                                            } else {
                                                setPendingStationId(s.id)
                                            }

                                            return
                                        }

                                        if (activeTool !== 'select') {
                                            return
                                        }

                                        setDraggingStationId(s.id)
                                        stationDragStartRef.current = {
                                            x: event.clientX,
                                            y: event.clientY,
                                        }
                                    }}

                                    onDoubleClick={(event) => {
                                        event.stopPropagation()

                                        if (activeTool !== 'select') {
                                            return
                                        }

                                        const newName = window.prompt(
                                            'Station name:',
                                            s.name || ''
                                        )

                                        if (newName !== null) {
                                            setStationName(s.id, newName)
                                        }
                                    }}

                                />

                                {s.name && (
                                    <text
                                        x={s.x}
                                        y={s.y - 12}
                                        textAnchor="middle"
                                        fontSize={16}
                                        fontWeight="bold"
                                        fill="#111"
                                        style={{
                                            pointerEvents: 'none',
                                        }}
                                    >
                                        {s.name}
                                    </text>
                                )}
                            </g>
                        )
                    })}
                </g>
            </svg>
        </div>
    )
}
