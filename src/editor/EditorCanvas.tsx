import { useEffect, useRef, useState, useMemo, useCallback } from 'react'

import { useEditorStore, type EditorTool } from '../store/editorStore'
import { snapPointToOctolinear } from '../geometry/octolinear'
import { useMapExport } from './useMapExport'
import { useEditorKeyboardShortcuts } from './useEditorKeyboardShortcuts'
import { useCanvasInteractions } from './useCanvasInteractions'
import { useCanvasKeyboardNavigation } from './useCanvasKeyboardNavigation'

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
import { StationNameDialog } from './StationNameDialog'
import { RenameDialog } from './RenameDialog'
import { Menu, MenuItem, Divider, Checkbox, ListItemIcon, ListItemText, Snackbar, Alert } from '@mui/material'
import { useTranslation } from 'react-i18next'

import './EditorCanvas.css'

export function EditorCanvas() {
    const activeTool = useEditorStore((s) => s.activeTool)
    const setActiveTool = useEditorStore((s) => s.setActiveTool)
    const stations = useEditorStore((s) => s.stations)
    const segments = useEditorStore((s) => s.segments)
    const lines = useEditorStore((s) => s.lines)
    const shapes = useEditorStore((s) => s.shapes)

    const segmentsList = useMemo(() => Object.values(segments), [segments])

    const viewportRef = useRef(useEditorStore.getState().viewport)
    const viewportLayerRef = useRef<SVGGElement>(null)
    const zoomInStore = useEditorStore((s) => s.zoomIn)
    const zoomOutStore = useEditorStore((s) => s.zoomOut)
    const resetViewport = useEditorStore((s) => s.resetViewport)
    const autoPlaceLabels = useEditorStore((s) => s.autoPlaceLabels)
    const lineWidth = useEditorStore((s) => s.lineWidth)
    const setLineWidth = useEditorStore((s) => s.setLineWidth)
    const gridCellSize = useEditorStore((s) => s.gridCellSize)
    const gridCellsWidth = useEditorStore((s) => s.gridCellsWidth)
    const gridCellsHeight = useEditorStore((s) => s.gridCellsHeight)
    const showLineCodes = useEditorStore((s) => s.showLineCodes)
    const setShowLineCodes = useEditorStore((s) => s.setShowLineCodes)
    const freeformMode = useEditorStore((s) => s.freeformMode)
    const themeMode = useEditorStore((s) => s.themeMode)
    const canvasBackgroundColor = useEditorStore((s) => s.canvasBackgroundColor)

    const canvasBg = canvasBackgroundColor || (themeMode === 'dark' ? '#1e1e2e' : '#f5f5f5')
    const shapeHandleFill = themeMode === 'dark' ? '#1e1e2e' : '#fff'
    const shapeHandleStroke = themeMode === 'dark' ? '#90caf9' : '#1976d2'

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

    const backgroundImageUrl = useEditorStore((s) => s.backgroundImageUrl)
    const showBackgroundImage = useEditorStore((s) => s.showBackgroundImage)
    const backgroundImageX = useEditorStore((s) => s.backgroundImageX)
    const backgroundImageY = useEditorStore((s) => s.backgroundImageY)
    const backgroundImageWidth = useEditorStore((s) => s.backgroundImageWidth)
    const backgroundImageHeight = useEditorStore((s) => s.backgroundImageHeight)
    const backgroundImageOpacity = useEditorStore((s) => s.backgroundImageOpacity)

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
    const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([])
    const selectedShapeId = selectedShapeIds[0] ?? null
    const setSelectedShapeId = useCallback((id: string | null) => setSelectedShapeIds(id ? [id] : []), [])
    const [draggingShapeVertex, setDraggingShapeVertex] = useState<{
        shapeId: string
        pointIndex: number
    } | null>(null)

    // Segment hover / tooltip state
    const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null)
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)

    const anarchyMode = useEditorStore((s) => s.anarchyMode)
    const setAnarchyMode = useEditorStore((s) => s.setAnarchyMode)
    const [anarchyToastOpen, setAnarchyToastOpen] = useState(false)

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
    const setStationLabelRotation = useEditorStore(
        (s) => s.setStationLabelRotation
    )
    const setStationServices = useEditorStore(
        (s) => s.setStationServices
    )
    const { t } = useTranslation()

    // Secret shortcut: Ctrl+Shift+Alt+A
    useEffect(() => {
        const handleAnarchyShortcut = (e: KeyboardEvent) => {
            const active = document.activeElement
            const tag = active?.tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA') return

            if (e.ctrlKey && e.shiftKey && e.altKey && e.code === 'KeyA') {
                e.preventDefault()
                setAnarchyMode(true)
                setAnarchyToastOpen(true)
            }
        }
        window.addEventListener('keydown', handleAnarchyShortcut)
        return () => window.removeEventListener('keydown', handleAnarchyShortcut)
    }, [setAnarchyMode])

    const addLine = useEditorStore((s) => s.addLine)
    const setLineName = useEditorStore((s) => s.setLineName)
    const addShape = useEditorStore((s) => s.addShape)
    const updateShape = useEditorStore((s) => s.updateShape)
    const deleteShape = useEditorStore((s) => s.deleteShape)

    const undo = useEditorStore((s) => s.undo)
    const redo = useEditorStore((s) => s.redo)
    const clear = useEditorStore((s) => s.clear)
    const pastStates = useEditorStore((s) => s.pastStates)
    const futureStates = useEditorStore((s) => s.futureStates)

    const { showGridForExport, showSelectionForExport, showInteractiveHandlesForExport, exportAsSVG, exportAsPNG, print } = useMapExport(svgRef)

    const { spacePressed } = useEditorKeyboardShortcuts({
        selectedStationIds,
        selectedShapeIds,
        onDeleteSelected: () => {
            for (const stationId of selectedStationIds) {
                deleteStation(stationId)
            }
            for (const shapeId of selectedShapeIds) {
                deleteShape(shapeId)
            }
            setSelectedStationIds([])
            setSelectedShapeIds([])
        },
        onSelectAll: () => {
            setSelectedStationIds(Object.keys(stations))
            setSelectedShapeIds(Object.keys(shapes))
        },
        onUndo: undo,
        onRedo: redo,
        canUndo: pastStates.length > 0,
        canRedo: futureStates.length > 0,
        svgRef,
    })

    const {
        pointerWorldPosition,
        setPointerWorldPosition,
        isPanning,
        setDraggingStationId,
        setDraggingBendPoint,
        stationDragStartRef,
        beginDragHistoryTransaction,
        beginStationDrag,
        suppressNextClickRef,
        handleWheel,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handlePointerCancel,
        handleClick,
        stationNameDialogOpen,
        setStationNameDialogOpen,
        handleStationNameSave,
        handleStationNameCancel,
        setPendingStationPosition,
    } = useCanvasInteractions({ spacePressed, selectedStationIds, selectedShapeIds })

    const [keyboardCursorVisible, setKeyboardCursorVisible] = useState(false)

    const { keyboardCursor, handleKeyDown: handleCanvasKeyDown } = useCanvasKeyboardNavigation({
        onKeyboardCursorShown: () => setKeyboardCursorVisible(true),

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
    })

    // Sync pointer world position with keyboard cursor so the segment preview
    // line follows the cursor when navigating by keyboard.
    useEffect(() => {
        if (keyboardCursor) {
            setPointerWorldPosition(keyboardCursor)
        }
    }, [keyboardCursor, setPointerWorldPosition])

    // Attach wheel event listener with passive: false to allow preventDefault
    useEffect(() => {
        const svg = svgRef.current
        if (!svg) return

        const onWheel = (e: WheelEvent) => handleWheel(e as unknown as React.WheelEvent<SVGSVGElement>)
        svg.addEventListener('wheel', onWheel, { passive: false })

        return () => {
            svg.removeEventListener('wheel', onWheel)
        }
    }, [handleWheel])

    // Transient subscription to viewport changes to avoid react re-renders
    useEffect(() => {
        const unsubscribe = useEditorStore.subscribe((state) => {
            viewportRef.current = state.viewport
            if (viewportLayerRef.current) {
                viewportLayerRef.current.setAttribute(
                    'transform',
                    `translate(${state.viewport.offsetX} ${state.viewport.offsetY}) scale(${state.viewport.zoom})`
                )
                // Dynamically scale vertex handles so they keep constant visual size
                const vertexHandles = viewportLayerRef.current.querySelectorAll('.vertex-handle')
                vertexHandles.forEach((handle) => {
                    handle.setAttribute('r', (6 / state.viewport.zoom).toString())
                })
                const previewVertices = viewportLayerRef.current.querySelectorAll('.preview-vertex')
                previewVertices.forEach((vertex) => {
                    vertex.setAttribute('r', (5 / state.viewport.zoom).toString())
                })
            }
        })
        return unsubscribe
    }, [])

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (shapePoints.length > 0) {
                    setShapePoints([])
                }
                if (selectedShapeId) {
                    setSelectedShapeId(null)
                }
                if (selectedStationIds.length > 0) {
                    setSelectedStationIds([])
                }
            }
            if ((e.key === 'Backspace' || e.key === 'Delete') && activeTool === 'shape' && shapePoints.length > 0) {
                setShapePoints((prev) => prev.slice(0, -1))
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [shapePoints.length, selectedShapeId, activeTool, selectedStationIds, setSelectedStationIds, setSelectedShapeId, setShapePoints])

    const insertBendPoint = useEditorStore((s) => s.insertBendPoint)
    const removeBendPoint = useEditorStore((s) => s.removeBendPoint)

    // Double-click on a segment polyline (in select mode) inserts a new bend
    // point at the click position, snapped to the grid.
    const handleStationContextMenu = (stationId: string, event: React.MouseEvent<SVGElement>) => {
        const menuWidth = 180
        const menuHeight = 320
        const vv = window.visualViewport
        const vpWidth = vv?.width ?? window.innerWidth
        const vpHeight = vv?.height ?? window.innerHeight
        const clampedX = Math.min(Math.max(event.clientX, menuWidth / 2), vpWidth - menuWidth / 2)
        const clampedY = Math.min(Math.max(event.clientY, menuHeight / 2), vpHeight - menuHeight / 2)
        setContextMenuStationId(stationId)
        setContextMenuPos({ x: clampedX, y: clampedY })
        setDraggingStationId(null)
        stationDragStartRef.current = null
        suppressNextClickRef.current = true
    }

    const handleStationLongPress = (stationId: string) => {
        const station = stations[stationId]
        if (!station) return
        const { x: screenX, y: screenY } = worldToScreen(station.x, station.y, viewportRef.current)
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
        const world = screenToWorld(x, y, viewportRef.current)
        const snapped = freeformMode ? world : snapPointToGrid(world.x, world.y, gridCellSize)

        // Hit-test against each segment polyline; threshold is in world units.
        const threshold = 10 / viewportRef.current.zoom
        for (const segment of segmentsList) {
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
            ? freeformMode
                ? pointerWorldPosition
                : snapPointToOctolinear(pendingStation, pointerWorldPosition)
            : null

    const handleSetActiveTool = useCallback((tool: EditorTool) => {
        if (tool !== 'select') {
            if (selectedStationIds.length > 0) {
                setSelectedStationIds([])
            }
            if (selectedShapeId) {
                setSelectedShapeId(null)
            }
        }
        setActiveTool(tool)
    }, [selectedStationIds, selectedShapeId, setSelectedStationIds, setSelectedShapeId, setActiveTool])

    return (
        <div className="editor-canvas" data-theme={themeMode}>
            <EditorToolbar
                activeTool={activeTool}
                setActiveTool={handleSetActiveTool}
                undo={undo}
                redo={redo}
                canUndo={pastStates.length > 0}
                canRedo={futureStates.length > 0}
                exportAsSVG={() => void exportAsSVG()}
                exportAsPNG={() => void exportAsPNG()}
                onPrint={() => void print()}
                clear={clear}
                setSelectedLineId={setSelectedLineId}
                gridCellsWidth={gridCellsWidth}
                setGridCellsWidth={useEditorStore((s) => s.setGridCellsWidth)}
                gridCellsHeight={gridCellsHeight}
                setGridCellsHeight={useEditorStore((s) => s.setGridCellsHeight)}
                lineWidth={lineWidth}
                setLineWidth={setLineWidth}
                showLineCodes={showLineCodes}
                setShowLineCodes={setShowLineCodes}
                selectedLineId={selectedLineId}
                lines={lines}
                isCreatingLine={isCreatingLine}
                setIsCreatingLine={setIsCreatingLine}
                addLine={addLine}
                setLineName={setLineName}
                setLineCode={useEditorStore((s) => s.setLineCode)}
                setLineColor={useEditorStore((s) => s.setLineColor)}
                setLineStyle={useEditorStore((s) => s.setLineStyle)}
                setLineTransitMode={useEditorStore((s) => s.setLineTransitMode)}
                setLineLineWidth={useEditorStore((s) => s.setLineLineWidth)}
                deleteLine={useEditorStore((s) => s.deleteLine)}
                setPendingStationId={setPendingStationId}
                setPointerWorldPosition={setPointerWorldPosition}
                colorPalette={colorPalette}
                zoomIn={zoomIn}
                zoomOut={zoomOut}
                resetViewport={resetViewport}
                autoPlaceLabels={autoPlaceLabels}
                shapeColor={shapeColor}
                setShapeColor={setShapeColor}
            />

            <svg
                ref={svgRef}
                data-testid="editor-canvas"
                tabIndex={0}
                role="application"
                aria-label="Transit map canvas"
                width="100%"
                height="100%"
                style={{
                    cursor: isPanning
                        ? 'grabbing'
                        : spacePressed
                            ? 'grab'
                            : 'default',
                }}
                onKeyDown={handleCanvasKeyDown}
                onPointerDown={handlePointerDown}
                onPointerMove={(event) => {
                    if (draggingShapeVertex) {
                        const rect = event.currentTarget.getBoundingClientRect()
                        const x = event.clientX - rect.left
                        const y = event.clientY - rect.top
                        const world = screenToWorld(x, y, viewportRef.current)
                        const snapped = freeformMode ? world : snapPointToGrid(world.x, world.y, gridCellSize)
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
                        const world = screenToWorld(x, y, viewportRef.current)
                        const snapped = freeformMode ? world : snapPointToGrid(world.x, world.y, gridCellSize)
                        setShapePoints((prev) => [...prev, snapped])
                        return
                    }

                    if (activeTool === 'select') {
                        const rect = event.currentTarget.getBoundingClientRect()
                        const x = event.clientX - rect.left
                        const y = event.clientY - rect.top
                        const world = screenToWorld(x, y, viewportRef.current)
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
                        if (selectedStationIds.length > 0) {
                            setSelectedStationIds([])
                        }
                        handleClick(event)
                        return
                    }

                    handleClick(event)
                }}
                onDoubleClick={handleDoubleClick}
                onContextMenu={(e) => e.preventDefault()}
            >
                <rect
                    className="editor-canvas-background"
                    width="100%"
                    height="100%"
                    fill={canvasBg}
                />

                <g
                    ref={viewportLayerRef}
                    transform={`
            translate(${useEditorStore.getState().viewport.offsetX} ${useEditorStore.getState().viewport.offsetY})
            scale(${useEditorStore.getState().viewport.zoom})
          `}
                >
                    {backgroundImageUrl && showBackgroundImage && (
                        <image
                            href={backgroundImageUrl}
                            x={backgroundImageX}
                            y={backgroundImageY}
                            width={backgroundImageWidth}
                            height={backgroundImageHeight}
                            opacity={backgroundImageOpacity}
                            style={{
                                pointerEvents: 'none',
                            }}
                        />
                    )}

                    <GridLayer
                        gridCellSize={gridCellSize}
                        gridCellsWidth={gridCellsWidth}
                        gridCellsHeight={gridCellsHeight}
                        showGrid={showGridForExport && !freeformMode}
                        themeMode={themeMode}
                    />

                    <ShapeLayer shapes={shapes} />

                    {/* Selected shape vertex handles */}
                    {showInteractiveHandlesForExport && selectedShapeId && shapes[selectedShapeId] && (
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
                                    className="vertex-handle"
                                    cx={p.x}
                                    cy={p.y}
                                    r={6 / useEditorStore.getState().viewport.zoom}
                                    fill={shapeHandleFill}
                                    stroke={shapeHandleStroke}
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

                    {showInteractiveHandlesForExport && shapePoints.length > 0 && (
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
                                    className="preview-vertex"
                                    cx={p.x}
                                    cy={p.y}
                                    r={5 / useEditorStore.getState().viewport.zoom}
                                    fill={shapeColor}
                                    style={{ pointerEvents: 'none' }}
                                />
                            ))}
                        </>
                    )}

                    {/* Keyboard cursor */}
                    {showInteractiveHandlesForExport && keyboardCursorVisible && (
                        <g transform={`translate(${keyboardCursor.x} ${keyboardCursor.y})`}>
                            <circle
                                r={8 / useEditorStore.getState().viewport.zoom}
                                fill="none"
                                stroke="#1976d2"
                                strokeWidth={2 / useEditorStore.getState().viewport.zoom}
                                strokeDasharray="4 2"
                                opacity={0.8}
                                style={{ pointerEvents: 'none' }}
                            />
                            <line
                                x1={-12 / useEditorStore.getState().viewport.zoom}
                                y1={0}
                                x2={12 / useEditorStore.getState().viewport.zoom}
                                y2={0}
                                stroke="#1976d2"
                                strokeWidth={1 / useEditorStore.getState().viewport.zoom}
                                opacity={0.8}
                                style={{ pointerEvents: 'none' }}
                            />
                            <line
                                x1={0}
                                y1={-12 / useEditorStore.getState().viewport.zoom}
                                x2={0}
                                y2={12 / useEditorStore.getState().viewport.zoom}
                                stroke="#1976d2"
                                strokeWidth={1 / useEditorStore.getState().viewport.zoom}
                                opacity={0.8}
                                style={{ pointerEvents: 'none' }}
                            />
                        </g>
                    )}

                    <SegmentLayer
                        segments={segmentsList}
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

                    {showInteractiveHandlesForExport && activeTool === 'segment' &&
                        pendingStation &&
                        previewEndPoint &&
                        selectedLineId && (
                            <PreviewLine
                                fromStation={pendingStation}
                                toPoint={previewEndPoint}
                                lineColor={lines[selectedLineId]?.color || '#1976d2'}
                            />
                        )}

                    {showInteractiveHandlesForExport && (activeTool === 'segment' || activeTool === 'select') && (
                        <BendPointRenderer
                            segments={segmentsList}
                            onBendPointDragStart={(segmentId, pointIndex) => {
                                beginDragHistoryTransaction()
                                setDraggingBendPoint({ segmentId, pointIndex })
                            }}
                            onBendPointDoubleClick={(segmentId, pointIndex) => {
                                removeBendPoint(segmentId, pointIndex)
                            }}
                        />
                    )}

                    <StationRenderer
                        stations={stations}
                        segments={segments}
                        lines={lines}
                        lineWidth={lineWidth}
                        activeTool={activeTool}
                        selectedStationIds={selectedStationIds}
                        pendingStationId={pendingStationId}
                        selectedLineId={selectedLineId}
                        showLineCodes={showLineCodes}
                        themeMode={themeMode}
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
                                if (!selectedStationIds.includes(stationId)) {
                                    setSelectedStationIds([stationId])
                                    setSelectedShapeIds([])
                                }
                                beginDragHistoryTransaction()
                                beginStationDrag(stationId)
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
                        onStationContextMenu={handleStationContextMenu}
                        showSelection={showSelectionForExport}
                    />
                </g>
            </svg>

            <RenameDialog
                open={renameDialogOpen}
                title={t('editorCanvas.stationNameTitle')}
                initialValue={renameStationId ? stations[renameStationId]?.name ?? '' : ''}
                placeholder={t('editorCanvas.stationNamePlaceholder')}
                confirmLabel={t('common.save')}
                onConfirm={handleRenameConfirm}
                onCancel={() => {
                    setRenameDialogOpen(false)
                    setRenameStationId(null)
                }}
            />

            <StationNameDialog
                open={stationNameDialogOpen}
                onSave={handleStationNameSave}
                onCancel={handleStationNameCancel}
                anarchyMode={anarchyMode}
            />

            <Snackbar
                open={anarchyToastOpen}
                autoHideDuration={4000}
                onClose={() => setAnarchyToastOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setAnarchyToastOpen(false)}
                    severity="warning"
                    variant="filled"
                    sx={{ width: '100%', fontWeight: 700 }}
                >
                    🏴‍☠️ Anarchy Mode activated — all limits removed!
                </Alert>
            </Snackbar>
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
                <MenuItem onClick={handleRenameStation}>{t('common.rename')}</MenuItem>
                <MenuItem onClick={handleDeleteStation}>{t('common.delete')}</MenuItem>
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
                        {t(`editorCanvas.label${pos.charAt(0).toUpperCase() + pos.slice(1)}` as const)}
                    </MenuItem>
                ))}
                {([-90, -45, 0, 45, 90] as const).map((angle) => (
                    <MenuItem
                        key={`rot-${angle}`}
                        onClick={() => {
                            if (contextMenuStationId) {
                                setStationLabelRotation(contextMenuStationId, angle)
                            }
                            setContextMenuStationId(null)
                            setContextMenuPos(null)
                        }}
                        selected={
                            stations[contextMenuStationId ?? '']?.labelRotation === angle ||
                            (angle === 0 && stations[contextMenuStationId ?? '']?.labelRotation === undefined)
                        }
                    >
                        {t('editorCanvas.labelRotation', { angle })}
                    </MenuItem>
                ))}
                <Divider />
                <MenuItem disabled>{t('editorCanvas.services')}</MenuItem>
                {([
                    // Legacy icons
                    { key: 'accessibility' as const, labelKey: 'editorCanvas.accessibility', icon: '♿' },
                    { key: 'ferry' as const, labelKey: 'editorCanvas.ferry', icon: '⛴' },
                    { key: 'rail' as const, labelKey: 'editorCanvas.rail', icon: '🚂' },
                    { key: 'airport' as const, labelKey: 'editorCanvas.airport', icon: '✈' },
                    { key: 'toilet' as const, labelKey: 'editorCanvas.toilet', icon: '🚻' },
                    // Transit icons
                    { key: 'train' as const, labelKey: 'editorCanvas.train', icon: '🚆' },
                    { key: 'directions_bus' as const, labelKey: 'editorCanvas.bus', icon: '🚌' },
                    { key: 'directions_subway' as const, labelKey: 'editorCanvas.subway', icon: '🚇' },
                    { key: 'tram' as const, labelKey: 'editorCanvas.tram', icon: '🚊' },
                    { key: 'local_taxi' as const, labelKey: 'editorCanvas.taxi', icon: '🚕' },
                    { key: 'directions_bike' as const, labelKey: 'editorCanvas.bike', icon: '🚲' },
                    { key: 'electric_car' as const, labelKey: 'editorCanvas.electricCar', icon: '⚡' },
                    { key: 'local_parking' as const, labelKey: 'editorCanvas.parking', icon: '🅿' },
                    // POI icons
                    { key: 'shopping' as const, labelKey: 'editorCanvas.shopping', icon: '🛍' },
                    { key: 'restaurant' as const, labelKey: 'editorCanvas.restaurant', icon: '🍽' },
                    { key: 'cafe' as const, labelKey: 'editorCanvas.cafe', icon: '☕' },
                    { key: 'hotel' as const, labelKey: 'editorCanvas.hotel', icon: '🏨' },
                    { key: 'local_hospital' as const, labelKey: 'editorCanvas.hospital', icon: '🏥' },
                    { key: 'school' as const, labelKey: 'editorCanvas.school', icon: '🏫' },
                    { key: 'museum' as const, labelKey: 'editorCanvas.museum', icon: '🏛' },
                    { key: 'park' as const, labelKey: 'editorCanvas.park', icon: '🌳' },
                ]).map(({ key, labelKey, icon }) => (
                    <MenuItem
                        key={key}
                        dense
                        onClick={() => {
                            if (contextMenuStationId) {
                                const current = stations[contextMenuStationId]?.services ?? []
                                const hasService = current.includes(key)
                                const next = hasService
                                    ? current.filter((s) => s !== key)
                                    : [...current, key]
                                setStationServices(contextMenuStationId, next)
                            }
                            // Menu stays open for multi-select convenience
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                            <span style={{ fontSize: 16, opacity: 0.8 }}>{icon}</span>
                        </ListItemIcon>
                        <ListItemText primary={t(labelKey)} sx={{ flexGrow: 1 }} />
                        <Checkbox
                            checked={stations[contextMenuStationId ?? '']?.services?.includes(key) ?? false}
                            size="small"
                            sx={{ p: 0.5, mr: -0.5 }}
                        />
                    </MenuItem>
                ))}
            </Menu>

            {/* Segment hover tooltip */}
            {tooltipPos && hoveredSegmentId && segments[hoveredSegmentId] && (
                <div
                    className="segment-tooltip"
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
