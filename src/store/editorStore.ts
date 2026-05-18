import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { Station } from '../model/station'
import type { Segment } from '../model/segment'
import type { Line } from '../model/line'
import type { Viewport } from '../viewport/coordinates'
import type { Point } from '../types/geometry'
import { createOctolinearPath } from '../geometry/octolinear'
import { validateLineName, validateStationName } from '../validation/constants'

export type EditorTool = 'select' | 'station' | 'segment'

type DataSnapshot = {
    stations: Record<string, Station>
    segments: Record<string, Segment>
    lines: Record<string, Line>
}

const createSnapshot = (state: EditorState): DataSnapshot => ({
    stations: state.stations,
    segments: state.segments,
    lines: state.lines,
})

// Helper function to check if a point is on a segment line
function isPointOnSegment(
    point: Point,
    segment: Segment,
    stations: Record<string, Station>,
    threshold: number = 10
): boolean {
    const fromStation = stations[segment.fromStationId]
    const toStation = stations[segment.toStationId]
    
    if (!fromStation || !toStation) {
        return false
    }
    
    // Check if point is close to any segment of the path
    for (let i = 0; i < segment.points.length - 1; i++) {
        const p1 = segment.points[i]
        const p2 = segment.points[i + 1]
        
        // Calculate distance from point to line segment
        const dist = pointToLineDistance(point, p1, p2)
        
        if (dist <= threshold) {
            // Check if point is within the segment bounds
            const minX = Math.min(p1.x, p2.x) - threshold
            const maxX = Math.max(p1.x, p2.x) + threshold
            const minY = Math.min(p1.y, p2.y) - threshold
            const maxY = Math.max(p1.y, p2.y) + threshold
            
            if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) {
                return true
            }
        }
    }
    
    return false
}

// Helper function to calculate distance from point to line segment
function pointToLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
    const A = point.x - lineStart.x
    const B = point.y - lineStart.y
    const C = lineEnd.x - lineStart.x
    const D = lineEnd.y - lineStart.y
    
    const dot = A * C + B * D
    const lenSq = C * C + D * D
    
    let param = -1
    if (lenSq !== 0) {
        param = dot / lenSq
    }
    
    let xx, yy
    
    if (param < 0) {
        xx = lineStart.x
        yy = lineStart.y
    } else if (param > 1) {
        xx = lineEnd.x
        yy = lineEnd.y
    } else {
        xx = lineStart.x + param * C
        yy = lineStart.y + param * D
    }
    
    const dx = point.x - xx
    const dy = point.y - yy
    
    return Math.sqrt(dx * dx + dy * dy)
}

type EditorState = {
    activeTool: EditorTool
    stations: Record<string, Station>
    segments: Record<string, Segment>
    lines: Record<string, Line>
    viewport: Viewport
    lineWidth: number

    pastStates: DataSnapshot[]
    futureStates: DataSnapshot[]

    setActiveTool: (tool: EditorTool) => void
    addStation: (x: number, y: number) => void
    moveStation: (id: string, x: number, y: number) => void
    setStationName: (id: string, name: string) => void
    deleteStation: (id: string) => void
    updateSegmentPoint: (segmentId: string, pointIndex: number, x: number, y: number) => void
    addSegment: (fromStationId: string, toStationId: string, lineId: string) => void
    deleteSegment: (id: string) => void
    addLine: (name: string, color: string) => void
    setLineName: (id: string, name: string) => void
    clear: () => void
    undo: () => void
    redo: () => void
    setViewport: (viewport: Viewport) => void
    zoomIn: (centerX?: number, centerY?: number) => void
    zoomOut: (centerX?: number, centerY?: number) => void
    resetViewport: () => void
    setLineWidth: (width: number) => void
}

export const useEditorStore = create<EditorState>()(
    persist(
        (set) => ({
    activeTool: 'select',
    stations: {},
    segments: {},
    lines: {},
    viewport: { zoom: 1, offsetX: 0, offsetY: 0 },
    lineWidth: 10,
    pastStates: [],
    futureStates: [],

    setActiveTool: (tool) =>
        set({
            activeTool: tool,
        }),

    addStation: (x, y) =>
        set((state) => {
            const id = nanoid()
            const currentSnapshot = createSnapshot(state)

            // Check if the new station is on any existing segment
            const pointOnSegment = { x, y }
            const segmentToSplit = Object.values(state.segments).find(
                (segment) => isPointOnSegment(pointOnSegment, segment, state.stations)
            )

            let newSegments = state.segments

            if (segmentToSplit) {
                // Split the segment into two segments
                const line = state.lines[segmentToSplit.lineId]
                if (!line) {
                    // If line doesn't exist, just add the station without splitting
                    return {
                        stations: {
                            ...state.stations,
                            [id]: { id, x, y },
                        },
                        segments: state.segments,
                        lines: state.lines,
                        pastStates: [...state.pastStates, currentSnapshot],
                        futureStates: [],
                    }
                }

                // Create two new segments
                const segment1Id = nanoid()
                const segment2Id = nanoid()
                const fromStation = state.stations[segmentToSplit.fromStationId]
                const toStation = state.stations[segmentToSplit.toStationId]

                if (!fromStation || !toStation) {
                    // If stations don't exist, just add the station without splitting
                    return {
                        stations: {
                            ...state.stations,
                            [id]: { id, x, y },
                        },
                        segments: state.segments,
                        lines: state.lines,
                        pastStates: [...state.pastStates, currentSnapshot],
                        futureStates: [],
                    }
                }

                const newStation = { id, x, y }
                const path1 = createOctolinearPath(fromStation, newStation)
                const path2 = createOctolinearPath(newStation, toStation)

                // Remove the old segment and add two new ones
                const { [segmentToSplit.id]: _removedSegment, ...remainingSegments } = state.segments
                newSegments = {
                    ...remainingSegments,
                    [segment1Id]: {
                        id: segment1Id,
                        fromStationId: segmentToSplit.fromStationId,
                        toStationId: id,
                        lineId: segmentToSplit.lineId,
                        color: segmentToSplit.color,
                        points: path1,
                    },
                    [segment2Id]: {
                        id: segment2Id,
                        fromStationId: id,
                        toStationId: segmentToSplit.toStationId,
                        lineId: segmentToSplit.lineId,
                        color: segmentToSplit.color,
                        points: path2,
                    },
                }
            }

            return {
                stations: {
                    ...state.stations,
                    [id]: {
                        id,
                        x,
                        y,
                    },
                },
                segments: newSegments,
                lines: state.lines,
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: [],
            }
        }),

    moveStation: (id, x, y) =>
        set((state) => {
            const station = state.stations[id]

            if (!station) {
                return state
            }

            const currentSnapshot = createSnapshot(state)

            const segments = Object.fromEntries(
                Object.entries(state.segments).map(
                    ([segmentId, segment]) => {
                        if (
                            segment.fromStationId !== id &&
                            segment.toStationId !== id
                        ) {
                            return [segmentId, segment]
                        }

                        const points = [...segment.points]

                        if (segment.fromStationId === id) {
                            points[0] = { x, y }
                        }

                        if (segment.toStationId === id) {
                            points[points.length - 1] = { x, y }
                        }

                        return [
                            segmentId,
                            {
                                ...segment,
                                points,
                            },
                        ]
                    }
                )
            )

            return {
                stations: {
                    ...state.stations,
                    [id]: {
                        ...station,
                        x,
                        y,
                    },
                },
                segments,
                lines: state.lines,
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: [],
            }
        }),

    setStationName: (id, name) =>
        set((state) => {
            const station = state.stations[id]

            if (!station) {
                return state
            }

            const validation = validateStationName(name)
            if (!validation.valid) {
                return state
            }

            const currentSnapshot = createSnapshot(state)

            return {
                stations: {
                    ...state.stations,
                    [id]: {
                        ...station,
                        name: validation.sanitized ?? name,
                    },
                },
                segments: state.segments,
                lines: state.lines,
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: [],
            }
        }),

    deleteStation: (id) =>
        set((state) => {
            const station = state.stations[id]

            if (!station) {
                return state
            }

            const currentSnapshot = createSnapshot(state)

            // Remove station and all connected segments
            const { [id]: _removedStation, ...remainingStations } = state.stations
            const remainingSegments = Object.fromEntries(
                Object.entries(state.segments).filter(
                    ([_, segment]) =>
                        segment.fromStationId !== id && segment.toStationId !== id
                )
            )

            return {
                stations: remainingStations,
                segments: remainingSegments,
                lines: state.lines,
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: [],
            }
        }),

    updateSegmentPoint: (segmentId, pointIndex, x, y) =>
        set((state) => {
            const segment = state.segments[segmentId]

            if (!segment) {
                return state
            }

            if (pointIndex < 0 || pointIndex >= segment.points.length) {
                return state
            }

            const currentSnapshot = createSnapshot(state)

            const newPoints = [...segment.points]
            newPoints[pointIndex] = { x, y }

            return {
                stations: state.stations,
                segments: {
                    ...state.segments,
                    [segmentId]: {
                        ...segment,
                        points: newPoints,
                    },
                },
                lines: state.lines,
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: [],
            }
        }),

    addSegment: (
        fromStationId,
        toStationId,
        lineId
    ) =>
        set((state) => {
            const from =
                state.stations[fromStationId]

            const to =
                state.stations[toStationId]

            const line = state.lines[lineId]

            if (!from || !to || !line) {
                return state
            }

            const id = nanoid()
            const points = createOctolinearPath(from, to)

            const currentSnapshot = createSnapshot(state)

            return {
                stations: state.stations,
                segments: {
                    ...state.segments,

                    [id]: {
                        id,

                        fromStationId,
                        toStationId,

                        lineId,
                        color: line.color,

                        points,
                    },
                },
                lines: state.lines,
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: [],
            }
        }),

    deleteSegment: (id) =>
        set((state) => {
            const segment = state.segments[id]

            if (!segment) {
                return state
            }

            const currentSnapshot = createSnapshot(state)

            const { [id]: _removedSegment, ...remainingSegments } = state.segments

            return {
                stations: state.stations,
                segments: remainingSegments,
                lines: state.lines,
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: [],
            }
        }),

    undo: () =>
        set((state) => {
            if (state.pastStates.length === 0) {
                return state
            }

            const currentState = createSnapshot(state)

            const previousState = state.pastStates[state.pastStates.length - 1]

            return {
                activeTool: state.activeTool,
                ...previousState,
                pastStates: state.pastStates.slice(0, -1),
                futureStates: [currentState, ...state.futureStates],
            }
        }),

    redo: () =>
        set((state) => {
            if (state.futureStates.length === 0) {
                return state
            }

            const currentState = createSnapshot(state)

            const nextState = state.futureStates[0]

            return {
                activeTool: state.activeTool,
                ...nextState,
                pastStates: [...state.pastStates, currentState],
                futureStates: state.futureStates.slice(1),
            }
        }),

    addLine: (name, color) =>
        set((state) => {
            const id = nanoid()

            const currentSnapshot = createSnapshot(state)

            return {
                stations: state.stations,
                segments: state.segments,
                lines: {
                    ...state.lines,
                    [id]: {
                        id,
                        name,
                        color,
                    },
                },
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: [],
            }
        }),

    setLineName: (id, name) =>
        set((state) => {
            const line = state.lines[id]

            if (!line) {
                return state
            }

            const validation = validateLineName(name)
            if (!validation.valid) {
                return state
            }

            const currentSnapshot = createSnapshot(state)

            return {
                stations: state.stations,
                segments: state.segments,
                lines: {
                    ...state.lines,
                    [id]: {
                        ...line,
                        name: validation.sanitized ?? name,
                    },
                },
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: [],
            }
        }),

    clear: () =>
        set(() => ({
            stations: {},
            segments: {},
            lines: {},
            pastStates: [],
            futureStates: [],
        })),

    setViewport: (viewport) =>
        set({ viewport }),

    zoomIn: (centerX?: number, centerY?: number) =>
        set((state) => {
            const oldZoom = state.viewport.zoom
            const newZoom = Math.min(10, oldZoom * 1.15)
            const zoomRatio = newZoom / oldZoom

            // If center coordinates are provided, adjust offsets to zoom around that point
            if (centerX !== undefined && centerY !== undefined) {
                return {
                    viewport: {
                        zoom: newZoom,
                        offsetX: centerX - (centerX - state.viewport.offsetX) * zoomRatio,
                        offsetY: centerY - (centerY - state.viewport.offsetY) * zoomRatio,
                    },
                }
            }

            // Otherwise just change zoom (legacy behavior)
            return {
                viewport: {
                    ...state.viewport,
                    zoom: newZoom,
                },
            }
        }),

    zoomOut: (centerX?: number, centerY?: number) =>
        set((state) => {
            const oldZoom = state.viewport.zoom
            const newZoom = Math.max(0.1, oldZoom / 1.15)
            const zoomRatio = newZoom / oldZoom

            // If center coordinates are provided, adjust offsets to zoom around that point
            if (centerX !== undefined && centerY !== undefined) {
                return {
                    viewport: {
                        zoom: newZoom,
                        offsetX: centerX - (centerX - state.viewport.offsetX) * zoomRatio,
                        offsetY: centerY - (centerY - state.viewport.offsetY) * zoomRatio,
                    },
                }
            }

            // Otherwise just change zoom (legacy behavior)
            return {
                viewport: {
                    ...state.viewport,
                    zoom: newZoom,
                },
            }
        }),

    resetViewport: () =>
        set(() => ({
            viewport: { zoom: 1, offsetX: 0, offsetY: 0 },
        })),

    setLineWidth: (width) =>
        set({ lineWidth: width }),

}),
        {
            name: 'transit-editor-storage',
            partialize: (state) => ({
                activeTool: state.activeTool,
                stations: state.stations,
                segments: state.segments,
                lines: state.lines,
                lineWidth: state.lineWidth,
            }),
        },
    ),
)
