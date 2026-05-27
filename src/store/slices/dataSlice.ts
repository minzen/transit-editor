import type { StateCreator } from 'zustand'
import { nanoid } from 'nanoid'
import type { Station, LabelPosition, ServiceIcon } from '../../model/station'
import type { Segment } from '../../model/segment'
import type { Line, LineStyle, TransitMode } from '../../model/line'
import type { Shape } from '../../model/shape'
import type { Point } from '../../types/geometry'
import { createOctolinearPath, createSmartOctolinearPath } from '../../geometry/octolinear'
import { chooseBestLabelPositions } from '../../geometry/labelPlacement'
import { isPointNearPolyline, pointToLineSegmentDistance } from '../../geometry/distance'
import { validateLineName, validateStationName } from '../../validation/constants'
import type { ToolSlice } from './toolSlice'
import type { ViewSlice } from './viewSlice'
import {
    createDelta,
    applyDelta,
    hasChanges,
} from '../utils/history'
import type { HistoryStep, DataSnapshot } from '../utils/history'

export type { DataSnapshot }

type FullState = DataSlice & ToolSlice & ViewSlice

const createSnapshot = (state: DataSlice): DataSnapshot => ({
    stations: state.stations,
    segments: state.segments,
    lines: state.lines,
    shapes: state.shapes,
})

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

    return isPointNearPolyline(point, segment.points, threshold)
}

export type DataSlice = {
    stations: Record<string, Station>
    segments: Record<string, Segment>
    lines: Record<string, Line>
    shapes: Record<string, Shape>
    pastStates: HistoryStep[]
    futureStates: HistoryStep[]

    addStation: (x: number, y: number, name?: string) => void
    moveStation: (id: string, x: number, y: number) => void
    setStationName: (id: string, name: string) => void
    setStationLabelPosition: (id: string, position: LabelPosition) => void
    autoPlaceLabels: () => void
    setStationServices: (id: string, services: ServiceIcon[]) => void
    setStationFareZone: (id: string, zone: number | undefined) => void
    deleteStation: (id: string) => void
    updateSegmentPoint: (segmentId: string, pointIndex: number, x: number, y: number) => void
    insertBendPoint: (segmentId: string, x: number, y: number) => void
    removeBendPoint: (segmentId: string, pointIndex: number) => void
    addSegment: (fromStationId: string, toStationId: string, lineId: string) => void
    deleteSegment: (id: string) => void
    addLine: (name: string, color: string, code?: string, lineStyle?: LineStyle, transitMode?: TransitMode) => void
    setLineName: (id: string, name: string) => void
    setLineCode: (id: string, code: string) => void
    setLineColor: (id: string, color: string) => void
    setLineStyle: (id: string, lineStyle: LineStyle) => void
    setLineTransitMode: (id: string, transitMode: TransitMode) => void
    clear: () => void
    undo: () => void
    redo: () => void
    addShape: (points: Point[], color: string, name?: string, opacity?: number) => void
    updateShape: (id: string, updates: Partial<Pick<Shape, 'points' | 'color' | 'name' | 'opacity'>>) => void
    deleteShape: (id: string) => void
}

const setWithDelta = (
    state: DataSlice,
    nextStateData: Partial<DataSlice>
): Partial<DataSlice> => {
    const prev = createSnapshot(state)
    const next = {
        stations: nextStateData.stations ?? state.stations,
        segments: nextStateData.segments ?? state.segments,
        lines: nextStateData.lines ?? state.lines,
        shapes: nextStateData.shapes ?? state.shapes,
    }
    const step = createDelta(prev, next)
    if (hasChanges(step.redo)) {
        return {
            ...next,
            pastStates: [...state.pastStates, step],
            futureStates: [],
        }
    }
    return nextStateData
}

export const createDataSlice: StateCreator<FullState, [], [], DataSlice> = (set) => ({
    stations: {},
    segments: {},
    lines: {},
    shapes: {},
    pastStates: [],
    futureStates: [],

    addStation: (x, y, name) =>
        set((state) => {
            const id = nanoid()

            const pointOnSegment = { x, y }
            const segmentToSplit = Object.values(state.segments).find(
                (segment) => isPointOnSegment(pointOnSegment, segment, state.stations)
            )

            let newSegments = state.segments

            if (segmentToSplit) {
                const lineIds = segmentToSplit.lineIds
                const validLines = lineIds.map(lineId => state.lines[lineId]).filter(line => line !== undefined)

                if (validLines.length === 0) {
                    return setWithDelta(state, {
                        stations: {
                            ...state.stations,
                            [id]: { id, x, y, name },
                        },
                    })
                }

                const fromStation = state.stations[segmentToSplit.fromStationId]
                const toStation = state.stations[segmentToSplit.toStationId]

                if (!fromStation || !toStation) {
                    return setWithDelta(state, {
                        stations: {
                            ...state.stations,
                            [id]: { id, x, y, name },
                        },
                    })
                }

                const newStation = { id, x, y, name }
                const path1 = createOctolinearPath(fromStation, newStation)
                const path2 = createOctolinearPath(newStation, toStation)

                const { [segmentToSplit.id]: _removedSegment, ...remainingSegments } = state.segments

                const newSegmentsEntries: Record<string, Segment>[] = lineIds.flatMap((lineId) => {
                    const segment1Id = nanoid()
                    const segment2Id = nanoid()
                    return [
                        {
                            [segment1Id]: {
                                id: segment1Id,
                                fromStationId: segmentToSplit.fromStationId,
                                toStationId: id,
                                lineIds: [lineId],
                                points: path1,
                            },
                        },
                        {
                            [segment2Id]: {
                                id: segment2Id,
                                fromStationId: id,
                                toStationId: segmentToSplit.toStationId,
                                lineIds: [lineId],
                                points: path2,
                            },
                        },
                    ]
                })

                newSegments = newSegmentsEntries.reduce(
                    (acc, entry) => ({ ...acc, ...entry }),
                    remainingSegments
                )
            }

            return setWithDelta(state, {
                stations: {
                    ...state.stations,
                    [id]: {
                        id,
                        x,
                        y,
                        name,
                    },
                },
                segments: newSegments,
            })
        }),

    moveStation: (id, x, y) =>
        set((state) => {
            const station = state.stations[id]

            if (!station) {
                return state
            }

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

            return setWithDelta(state, {
                stations: {
                    ...state.stations,
                    [id]: {
                        ...station,
                        x,
                        y,
                    },
                },
                segments,
            })
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

            return setWithDelta(state, {
                stations: {
                    ...state.stations,
                    [id]: {
                        ...station,
                        name: validation.sanitized ?? name,
                    },
                },
            })
        }),

    setStationLabelPosition: (id, position) =>
        set((state) => {
            const station = state.stations[id]

            if (!station) {
                return state
            }

            return setWithDelta(state, {
                stations: {
                    ...state.stations,
                    [id]: {
                        ...station,
                        labelPosition: position,
                    },
                },
            })
        }),

    autoPlaceLabels: () =>
        set((state) => {
            const placed = chooseBestLabelPositions(state.stations, state.segments)
            const nextStations: Record<string, Station> = { ...state.stations }
            for (const [id, position] of Object.entries(placed)) {
                const station = nextStations[id]
                if (!station) continue
                if (station.labelPosition === position) continue
                nextStations[id] = { ...station, labelPosition: position }
            }
            if (nextStations === state.stations) return state
            return setWithDelta(state, { stations: nextStations })
        }),

    setStationServices: (id, services) =>
        set((state) => {
            const station = state.stations[id]

            if (!station) {
                return state
            }

            return setWithDelta(state, {
                stations: {
                    ...state.stations,
                    [id]: {
                        ...station,
                        services: services.length > 0 ? services : undefined,
                    },
                },
            })
        }),

    setStationFareZone: (id, zone) =>
        set((state) => {
            const station = state.stations[id]

            if (!station) {
                return state
            }

            return setWithDelta(state, {
                stations: {
                    ...state.stations,
                    [id]: {
                        ...station,
                        fareZone: zone,
                    },
                },
            })
        }),

    deleteStation: (id) =>
        set((state) => {
            const station = state.stations[id]

            if (!station) {
                return state
            }

            const { [id]: _removedStation, ...remainingStations } = state.stations
            const remainingSegments = Object.fromEntries(
                Object.entries(state.segments).filter(
                    ([_, segment]) =>
                        segment.fromStationId !== id && segment.toStationId !== id
                )
            )

            return setWithDelta(state, {
                stations: remainingStations,
                segments: remainingSegments,
            })
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

            const newPoints = [...segment.points]
            newPoints[pointIndex] = { x, y }

            return setWithDelta(state, {
                segments: {
                    ...state.segments,
                    [segmentId]: {
                        ...segment,
                        points: newPoints,
                    },
                },
            })
        }),

    insertBendPoint: (segmentId, x, y) =>
        set((state) => {
            const segment = state.segments[segmentId]
            if (!segment) {
                return state
            }

            const click = { x, y }
            let bestEdgeIndex = 0
            let bestDistance = Infinity
            for (let i = 0; i < segment.points.length - 1; i++) {
                const d = pointToLineSegmentDistance(
                    click,
                    segment.points[i],
                    segment.points[i + 1]
                )
                if (d < bestDistance) {
                    bestDistance = d
                    bestEdgeIndex = i
                }
            }

            const insertAt = bestEdgeIndex + 1
            const newPoints = [
                ...segment.points.slice(0, insertAt),
                { x, y },
                ...segment.points.slice(insertAt),
            ]

            return setWithDelta(state, {
                segments: {
                    ...state.segments,
                    [segmentId]: {
                        ...segment,
                        points: newPoints,
                    },
                },
            })
        }),

    removeBendPoint: (segmentId, pointIndex) =>
        set((state) => {
            const segment = state.segments[segmentId]
            if (!segment) {
                return state
            }

            if (pointIndex <= 0 || pointIndex >= segment.points.length - 1) {
                return state
            }

            const newPoints = [
                ...segment.points.slice(0, pointIndex),
                ...segment.points.slice(pointIndex + 1),
            ]

            return setWithDelta(state, {
                segments: {
                    ...state.segments,
                    [segmentId]: {
                        ...segment,
                        points: newPoints,
                    },
                },
            })
        }),

    addSegment: (fromStationId, toStationId, lineId) =>
        set((state) => {
            const from = state.stations[fromStationId]
            const to = state.stations[toStationId]
            const line = state.lines[lineId]

            if (!from || !to || !line) {
                return state
            }

            const id = nanoid()
            const obstacles: Point[] = Object.values(state.stations)
                .filter((s) => s.id !== fromStationId && s.id !== toStationId)
                .map((s) => ({ x: s.x, y: s.y }))
            const points = createSmartOctolinearPath(from, to, obstacles)

            return setWithDelta(state, {
                segments: {
                    ...state.segments,
                    [id]: {
                        id,
                        fromStationId,
                        toStationId,
                        lineIds: [lineId],
                        points,
                    },
                },
            })
        }),

    deleteSegment: (id) =>
        set((state) => {
            const segment = state.segments[id]

            if (!segment) {
                return state
            }

            const { [id]: _removedSegment, ...remainingSegments } = state.segments

            return setWithDelta(state, {
                segments: remainingSegments,
            })
        }),

    undo: () =>
        set((state) => {
            if (state.pastStates.length === 0) {
                return state
            }

            const step = state.pastStates[state.pastStates.length - 1]
            const current = createSnapshot(state)
            const undone = applyDelta(current, step.undo)

            return {
                ...undone,
                pastStates: state.pastStates.slice(0, -1),
                futureStates: [step, ...state.futureStates],
            }
        }),

    redo: () =>
        set((state) => {
            if (state.futureStates.length === 0) {
                return state
            }

            const step = state.futureStates[0]
            const current = createSnapshot(state)
            const redone = applyDelta(current, step.redo)

            return {
                ...redone,
                pastStates: [...state.pastStates, step],
                futureStates: state.futureStates.slice(1),
            }
        }),

    addLine: (name, color, code, lineStyle, transitMode) =>
        set((state) => {
            const id = nanoid()

            return setWithDelta(state, {
                lines: {
                    ...state.lines,
                    [id]: {
                        id,
                        name,
                        color,
                        code: code && code.length > 0 ? code : undefined,
                        lineStyle: lineStyle ?? 'solid',
                        transitMode: transitMode ?? 'metro',
                    },
                },
            })
        }),

    setLineCode: (id, code) =>
        set((state) => {
            const line = state.lines[id]
            if (!line) {
                return state
            }

            const trimmed = code.trim().slice(0, 4)

            return setWithDelta(state, {
                lines: {
                    ...state.lines,
                    [id]: {
                        ...line,
                        code: trimmed.length > 0 ? trimmed : undefined,
                    },
                },
            })
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

            return setWithDelta(state, {
                lines: {
                    ...state.lines,
                    [id]: {
                        ...line,
                        name: validation.sanitized ?? name,
                    },
                },
            })
        }),

    setLineColor: (id, color) =>
        set((state) => {
            const line = state.lines[id]
            if (!line) {
                return state
            }

            return setWithDelta(state, {
                lines: {
                    ...state.lines,
                    [id]: {
                        ...line,
                        color,
                    },
                },
            })
        }),

    setLineStyle: (id, lineStyle) =>
        set((state) => {
            const line = state.lines[id]
            if (!line) {
                return state
            }

            return setWithDelta(state, {
                lines: {
                    ...state.lines,
                    [id]: {
                        ...line,
                        lineStyle,
                    },
                },
            })
        }),

    setLineTransitMode: (id, transitMode) =>
        set((state) => {
            const line = state.lines[id]
            if (!line) {
                return state
            }

            return setWithDelta(state, {
                lines: {
                    ...state.lines,
                    [id]: {
                        ...line,
                        transitMode,
                    },
                },
            })
        }),

    clear: () =>
        set(() => ({
            stations: {},
            segments: {},
            lines: {},
            shapes: {},
            pastStates: [],
            futureStates: [],
        })),

    addShape: (points, color, name, opacity) =>
        set((state) => {
            const id = nanoid()
            return setWithDelta(state, {
                shapes: {
                    ...state.shapes,
                    [id]: {
                        id,
                        points,
                        color,
                        name: name && name.length > 0 ? name : undefined,
                        opacity: opacity ?? 0.5,
                    },
                },
            })
        }),

    updateShape: (id, updates) =>
        set((state) => {
            const shape = state.shapes[id]
            if (!shape) return state
            return setWithDelta(state, {
                shapes: {
                    ...state.shapes,
                    [id]: { ...shape, ...updates },
                },
            })
        }),

    deleteShape: (id) =>
        set((state) => {
            if (!state.shapes[id]) return state
            const { [id]: _removed, ...remainingShapes } = state.shapes
            return setWithDelta(state, {
                shapes: remainingShapes,
            })
        }),
})
