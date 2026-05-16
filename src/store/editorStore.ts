import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { Station } from '../model/station'
import type { Segment } from '../model/segment'
import { createOctolinearPath } from '../geometry/octolinear'

export type EditorTool = 'select' | 'station' | 'segment'

type EditorState = {
    activeTool: EditorTool
    stations: Record<string, Station>
    segments: Record<string, Segment>

    setActiveTool: (tool: EditorTool) => void
    addStation: (x: number, y: number) => void
    moveStation: (id: string, x: number, y: number) => void
    setStationName: (id: string, name: string) => void
    updateSegmentPoint: (segmentId: string, pointIndex: number, x: number, y: number) => void
    addSegment: (fromStationId: string, toStationId: string, color: string) => void
}

export const useEditorStore = create<EditorState>((set) => ({
    activeTool: 'select',
    stations: {},
    segments: {},

    setActiveTool: (tool) =>
        set({
            activeTool: tool,
        }),

    addStation: (x, y) =>
        set((state) => {
            const id = nanoid()

            return {
                stations: {
                    ...state.stations,
                    [id]: {
                        id,
                        x,
                        y,
                    },
                },
            }
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
            }
        }),

    setStationName: (id, name) =>
        set((state) => {
            const station = state.stations[id]

            if (!station) {
                return state
            }

            return {
                stations: {
                    ...state.stations,
                    [id]: {
                        ...station,
                        name,
                    },
                },
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

            const newPoints = [...segment.points]
            newPoints[pointIndex] = { x, y }

            return {
                segments: {
                    ...state.segments,
                    [segmentId]: {
                        ...segment,
                        points: newPoints,
                    },
                },
            }
        }),

    addSegment: (
        fromStationId,
        toStationId,
        color
    ) =>
        set((state) => {
            const from =
                state.stations[fromStationId]

            const to =
                state.stations[toStationId]

            if (!from || !to) {
                return state
            }

            const id = nanoid()
            const points = createOctolinearPath(from, to)

            return {
                segments: {
                    ...state.segments,

                    [id]: {
                        id,

                        fromStationId,
                        toStationId,

                        color,

                        points,
                    },
                },
            }
        }),

}))
