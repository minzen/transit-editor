import { useRef, useState } from 'react'

import { useEditorStore } from '../store/editorStore'
import { snapPointToOctolinear } from '../geometry/octolinear'
import { useMapExport } from './useMapExport'
import { useEditorKeyboardShortcuts } from './useEditorKeyboardShortcuts'
import { useCanvasInteractions } from './useCanvasInteractions'

import { GridLayer } from '../renderer/GridLayer'
import { SegmentLayer } from '../renderer/SegmentLayer'
import { PreviewLine } from '../renderer/PreviewLine'
import { StationRenderer } from '../renderer/StationRenderer'
import { BendPointRenderer } from '../renderer/BendPointRenderer'
import { screenToWorld } from '../viewport/coordinates'
import { snapPointToGrid } from '../geometry/snap'
import { isPointNearPolyline } from '../geometry/distance'

import { EditorToolbar } from './EditorToolbar'

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

    const [selectedStationId, setSelectedStationId] = useState<string | null>(null)

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

    const addLine = useEditorStore((s) => s.addLine)

    const undo = useEditorStore((s) => s.undo)
    const redo = useEditorStore((s) => s.redo)
    const clear = useEditorStore((s) => s.clear)
    const pastStates = useEditorStore((s) => s.pastStates)
    const futureStates = useEditorStore((s) => s.futureStates)

    const { showGridForExport, exportAsSVG, exportAsPNG } = useMapExport(svgRef)

    const { spacePressed } = useEditorKeyboardShortcuts({
        selectedStationId,
        onDeleteSelected: () => {
            if (selectedStationId) {
                deleteStation(selectedStationId)
                setSelectedStationId(null)
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
        handleWheel,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handleClick,
    } = useCanvasInteractions({ spacePressed })

    const insertBendPoint = useEditorStore((s) => s.insertBendPoint)
    const removeBendPoint = useEditorStore((s) => s.removeBendPoint)

    // Double-click on a segment polyline (in select mode) inserts a new bend
    // point at the click position, snapped to the grid.
    const handleDoubleClick = (event: React.MouseEvent<SVGSVGElement>) => {
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

                    <SegmentLayer
                        segments={Object.values(segments)}
                        lines={lines}
                        lineWidth={lineWidth}
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
                                station?.name ?? ''
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
