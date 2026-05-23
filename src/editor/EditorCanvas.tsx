import { useEffect, useRef, useState } from 'react'

import { useEditorStore } from '../store/editorStore'
import { snapPointToOctolinear } from '../geometry/octolinear'
import { useMapExport } from './useMapExport'
import { useEditorKeyboardShortcuts } from './useEditorKeyboardShortcuts'
import { useCanvasInteractions } from './useCanvasInteractions'

import { GridLayer } from '../renderer/GridLayer'
import { SegmentLayer } from '../renderer/SegmentLayer'
import { ShapeLayer } from '../renderer/ShapeLayer'
import { PreviewLine } from '../renderer/PreviewLine'
import { StationRenderer } from '../renderer/StationRenderer'
import { BendPointRenderer } from '../renderer/BendPointRenderer'
import { screenToWorld, worldToScreen } from '../viewport/coordinates'
import { snapPointToGrid } from '../geometry/snap'
import { isPointNearPolyline, isPointInPolygon } from '../geometry/distance'

import { EditorToolbar } from './EditorToolbar'
import { RenameDialog } from './RenameDialog'
import { Menu, MenuItem, Divider } from '@mui/material'

import './EditorCanvas.css'

// Constants for magic numbers
const BACKGROUND_IMAGE_SIZE = 4000
const BACKGROUND_IMAGE_OFFSET = 0

export function EditorCanvas() {
    const activeTool = useEditorStore((s) => s.activeTool)
    const setActiveTool = useEditorStore((s) => s.setActiveTool)
    const stations = useEditorStore((s) => s.stations)
    const segments = useEditorStore((s) => s.segments)
    const lines = useEditorStore((s) => s.lines)
    const shapes = useEditorStore((s) => s.shapes)

    const viewport = useEditorStore((s) => s.viewport)
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

    const [selectedStationIds, setSelectedStationIds] = useState<string[]>([])
    const [contextMenuStationId, setContextMenuStationId] = useState<string | null>(null)
    const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null)
    const [renameDialogOpen, setRenameDialogOpen] = useState(false)
    const [renameStationId, setRenameStationId] = useState<string | null>(null)

    // Shape-drawing state
    const [shapePoints, setShapePoints] = useState<{ x: number; y: number }[]>([])
    const [shapeColor, setShapeColor] = useState('#a8d5e2')

    // Shape editing state
    const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null)
    const [draggingShapeVertex, setDraggingShapeVertex] = useState<{
        shapeId: string
        pointIndex: number
    } | null>(null)

    // Segment hover / tooltip state
    const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null)
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)

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

    const setStationLabelPosition = useEditorStore(
        (s) => s.setStationLabelPosition
    )

    const addLine = useEditorStore((s) => s.addLine)
    const addShape = useEditorStore((s) => s.addShape)
    const updateShape = useEditorStore((s) => s.updateShape)
    const deleteShape = useEditorStore((s) => s.deleteShape)

    const undo = useEditorStore((s) => s.undo)
    const redo = useEditorStore((s) => s.redo)
    const clear = useEditorStore((s) => s.clear)
    const pastStates = useEditorStore((s) => s.pastStates)
    const futureStates = useEditorStore((s) => s.futureStates)

    const { showGridForExport, showSelectionForExport, exportAsSVG, exportAsPNG } = useMapExport(svgRef)

    const { spacePressed } = useEditorKeyboardShortcuts({
        selectedStationIds,
        selectedShapeId,
        onDeleteSelected: () => {
            if (selectedStationIds.length > 0) {
                for (const stationId of selectedStationIds) {
                    deleteStation(stationId)
                }
                setSelectedStationIds([])
            } else if (selectedShapeId) {
                deleteShape(selectedShapeId)
                setSelectedShapeId(null)
            }
        },
    })

    const {
        pointerWorldPosition,
        setPointerWorldPosition,
        isPanning,
        setDraggingStationId,
        setDraggingBendPoint,
        stationDragStartRef,
        suppressNextClickRef,
        handleWheel,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handlePointerCancel,
        handleClick,
    } = useCanvasInteractions({ spacePressed })

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (shapePoints.length > 0) {
                    setShapePoints([])
                }
                if (selectedShapeId) {
                    setSelectedShapeId(null)
                }
            }
            if ((e.key === 'Backspace' || e.key === 'Delete') && activeTool === 'shape' && shapePoints.length > 0) {
                setShapePoints((prev) => prev.slice(0, -1))
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [shapePoints.length, selectedShapeId, activeTool])

    const insertBendPoint = useEditorStore((s) => s.insertBendPoint)
    const removeBendPoint = useEditorStore((s) => s.removeBendPoint)

    // Double-click on a segment polyline (in select mode) inserts a new bend
    // point at the click position, snapped to the grid.
    const handleStationLongPress = (stationId: string) => {
        const station = stations[stationId]
        if (!station) return
        const { x: screenX, y: screenY } = worldToScreen(station.x, station.y, viewport)
        // Approximate menu dimensions so it stays on-screen
        const menuWidth = 180
        const menuHeight = 320
        const vv = window.visualViewport
        const vpWidth = vv?.width ?? window.innerWidth
        const vpHeight = vv?.height ?? window.innerHeight
        const clampedX = Math.min(
            Math.max(screenX, menuWidth / 2),
            vpWidth - menuWidth / 2
        )
        const clampedY = Math.min(
            Math.max(screenY, menuHeight / 2),
            vpHeight - menuHeight / 2
        )
        setContextMenuStationId(stationId)
        setContextMenuPos({ x: clampedX, y: clampedY })
        // Cancel any active drag and suppress the subsequent click
        setDraggingStationId(null)
        stationDragStartRef.current = null
        suppressNextClickRef.current = true
    }

    const handleRenameStation = () => {
        if (!contextMenuStationId) return
        setRenameStationId(contextMenuStationId)
        setRenameDialogOpen(true)
        setContextMenuStationId(null)
        setContextMenuPos(null)
    }

    const handleRenameConfirm = (newName: string) => {
        if (renameStationId) {
            setStationName(renameStationId, newName)
        }
        setRenameDialogOpen(false)
        setRenameStationId(null)
    }

    const handleDeleteStation = () => {
        if (!contextMenuStationId) return
        deleteStation(contextMenuStationId)
        setSelectedStationIds((prev) => prev.filter((id) => id !== contextMenuStationId))
        setContextMenuStationId(null)
        setContextMenuPos(null)
    }

    const handleDoubleClick = (event: React.MouseEvent<SVGSVGElement>) => {
        if (activeTool === 'shape') {
            if (shapePoints.length >= 3) {
                addShape(shapePoints, shapeColor)
                setShapePoints([])
            }
            return
        }

        if (activeTool !== 'select') return

        const rect = event.currentTarget.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top
        const world = screenToWorld(x, y, viewport)
        const snapped = snapPointToGrid(world.x, world.y, gridCellSize)

        // Hit-test against each segment polyline; threshold is in world units.
        const threshold = 10 / viewport.zoom
        for (const segment of Object.values(segments)) {
            if (isPointNearPolyline(world, segment.points, threshold)) {
                insertBendPoint(segment.id, snapped.x, snapped.y)
                return
            }
        }
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
                shapeColor={shapeColor}
                setShapeColor={setShapeColor}
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
                onPointerMove={(event) => {
                    if (draggingShapeVertex) {
                        const rect = event.currentTarget.getBoundingClientRect()
                        const x = event.clientX - rect.left
                        const y = event.clientY - rect.top
                        const world = screenToWorld(x, y, viewport)
                        const snapped = snapPointToGrid(world.x, world.y, gridCellSize)
                        const shape = shapes[draggingShapeVertex.shapeId]
                        if (shape) {
                            const newPoints = [...shape.points]
                            newPoints[draggingShapeVertex.pointIndex] = snapped
                            updateShape(draggingShapeVertex.shapeId, { points: newPoints })
                        }
                        return
                    }
                    handlePointerMove(event)
                }}
                onPointerUp={(event) => {
                    if (draggingShapeVertex) {
                        setDraggingShapeVertex(null)
                        return
                    }
                    handlePointerUp(event)
                }}
                onPointerCancel={(event) => {
                    if (draggingShapeVertex) {
                        setDraggingShapeVertex(null)
                        return
                    }
                    handlePointerCancel(event)
                }}
                onClick={(event) => {
                    if (activeTool === 'shape') {
                        const rect = event.currentTarget.getBoundingClientRect()
                        const x = event.clientX - rect.left
                        const y = event.clientY - rect.top
                        const world = screenToWorld(x, y, viewport)
                        const snapped = snapPointToGrid(world.x, world.y, gridCellSize)
                        setShapePoints((prev) => [...prev, snapped])
                        return
                    }

                    if (activeTool === 'select') {
                        const rect = event.currentTarget.getBoundingClientRect()
                        const x = event.clientX - rect.left
                        const y = event.clientY - rect.top
                        const world = screenToWorld(x, y, viewport)
                        for (const shape of Object.values(shapes)) {
                            if (isPointInPolygon(world, shape.points)) {
                                setSelectedShapeId(shape.id)
                                if (selectedStationIds.length > 0) {
                                    setSelectedStationIds([])
                                }
                                return
                            }
                        }
                        if (selectedShapeId) {
                            setSelectedShapeId(null)
                        }
                        handleClick(event)
                        return
                    }

                    handleClick(event)
                }}
                onDoubleClick={handleDoubleClick}
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

                    <ShapeLayer shapes={shapes} />

                    {/* Selected shape vertex handles */}
                    {selectedShapeId && shapes[selectedShapeId] && (
                        <>
                            {/* Invisible hit-area polygon on top for easier selection */}
                            <polygon
                                points={shapes[selectedShapeId].points.map((p) => `${p.x},${p.y}`).join(' ')}
                                fill="transparent"
                                style={{ pointerEvents: 'all' }}
                            />
                            {shapes[selectedShapeId].points.map((p, i) => (
                                <circle
                                    key={`vertex-${selectedShapeId}-${i}`}
                                    cx={p.x}
                                    cy={p.y}
                                    r={6 / viewport.zoom}
                                    fill="#fff"
                                    stroke="#1976d2"
                                    strokeWidth={2}
                                    style={{ cursor: 'move', pointerEvents: 'all' }}
                                    onPointerDown={(event) => {
                                        event.stopPropagation()
                                        setDraggingShapeVertex({ shapeId: selectedShapeId, pointIndex: i })
                                    }}
                                />
                            ))}
                        </>
                    )}

                    {shapePoints.length > 0 && (
                        <>
                            <polygon
                                points={shapePoints.map((p) => `${p.x},${p.y}`).join(' ')}
                                fill={shapeColor}
                                fillOpacity={0.3}
                                stroke={shapeColor}
                                strokeWidth={2}
                                strokeDasharray="4 4"
                                style={{ pointerEvents: 'none' }}
                            />
                            {shapePoints.map((p, i) => (
                                <circle
                                    key={i}
                                    cx={p.x}
                                    cy={p.y}
                                    r={5 / viewport.zoom}
                                    fill={shapeColor}
                                    style={{ pointerEvents: 'none' }}
                                />
                            ))}
                        </>
                    )}

                    <SegmentLayer
                        segments={Object.values(segments)}
                        lines={lines}
                        lineWidth={lineWidth}
                        selectedLineId={selectedLineId}
                        hoveredSegmentId={hoveredSegmentId}
                        onSegmentMouseEnter={(segmentId, event) => {
                            setHoveredSegmentId(segmentId)
                            const rect = svgRef.current?.getBoundingClientRect()
                            if (rect) {
                                setTooltipPos({
                                    x: event.clientX - rect.left,
                                    y: event.clientY - rect.top,
                                })
                            }
                        }}
                        onSegmentMouseLeave={() => {
                            setHoveredSegmentId(null)
                            setTooltipPos(null)
                        }}
                    />

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

                    <BendPointRenderer
                        segments={Object.values(segments)}
                        onBendPointDragStart={(segmentId, pointIndex) => {
                            setDraggingBendPoint({ segmentId, pointIndex })
                        }}
                        onBendPointDoubleClick={(segmentId, pointIndex) => {
                            removeBendPoint(segmentId, pointIndex)
                        }}
                    />

                    <StationRenderer
                        stations={stations}
                        segments={segments}
                        lines={lines}
                        lineWidth={lineWidth}
                        activeTool={activeTool}
                        selectedStationIds={selectedStationIds}
                        pendingStationId={pendingStationId}
                        selectedLineId={selectedLineId}
                        onStationPointerDown={(stationId, event) => {
                            event.stopPropagation()

                            if (selectedShapeId) {
                                setSelectedShapeId(null)
                            }

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

                            if (event.shiftKey) {
                                setSelectedStationIds((prev) =>
                                    prev.includes(stationId)
                                        ? prev.filter((id) => id !== stationId)
                                        : [...prev, stationId]
                                )
                            } else {
                                setSelectedStationIds([stationId])
                                setDraggingStationId(stationId)
                                stationDragStartRef.current = {
                                    x: event.clientX,
                                    y: event.clientY,
                                }
                            }
                        }}
                        onStationDoubleClick={(stationId) => {
                            if (activeTool !== 'select') {
                                return
                            }

                            setRenameStationId(stationId)
                            setRenameDialogOpen(true)
                        }}
                        onStationLongPress={handleStationLongPress}
                        showSelection={showSelectionForExport}
                    />
                </g>
            </svg>

            <RenameDialog
                open={renameDialogOpen}
                title="Station Name"
                initialValue={renameStationId ? stations[renameStationId]?.name ?? '' : ''}
                placeholder="Station name"
                confirmLabel="Save"
                onConfirm={handleRenameConfirm}
                onCancel={() => {
                    setRenameDialogOpen(false)
                    setRenameStationId(null)
                }}
            />
            <Menu
                open={Boolean(contextMenuStationId)}
                onClose={() => {
                    setContextMenuStationId(null)
                    setContextMenuPos(null)
                }}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenuPos
                        ? { top: contextMenuPos.y, left: contextMenuPos.x }
                        : undefined
                }
                transformOrigin={{ vertical: 'center', horizontal: 'center' }}
            >
                <MenuItem onClick={handleRenameStation}>Rename</MenuItem>
                <MenuItem onClick={handleDeleteStation}>Delete</MenuItem>
                <Divider />
                {(['top', 'bottom', 'left', 'right'] as const).map((pos) => (
                    <MenuItem
                        key={pos}
                        onClick={() => {
                            if (contextMenuStationId) {
                                setStationLabelPosition(contextMenuStationId, pos)
                            }
                            setContextMenuStationId(null)
                            setContextMenuPos(null)
                        }}
                        selected={
                            stations[contextMenuStationId ?? '']?.labelPosition === pos ||
                            (pos === 'top' && !stations[contextMenuStationId ?? '']?.labelPosition)
                        }
                    >
                        Label {pos.charAt(0).toUpperCase() + pos.slice(1)}
                    </MenuItem>
                ))}
            </Menu>

            {/* Segment hover tooltip */}
            {tooltipPos && hoveredSegmentId && segments[hoveredSegmentId] && (
                <div
                    style={{
                        position: 'absolute',
                        left: tooltipPos.x + 12,
                        top: tooltipPos.y - 12,
                        background: 'rgba(0,0,0,0.85)',
                        color: '#fff',
                        padding: '6px 10px',
                        borderRadius: 4,
                        fontSize: 12,
                        pointerEvents: 'none',
                        zIndex: 1000,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {segments[hoveredSegmentId].lineIds
                        .map((lineId) => lines[lineId]?.name ?? lineId)
                        .join(', ')}
                </div>
            )}
        </div>
    )
}
