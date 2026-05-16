import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { Station } from '../model/station'
import type { Segment } from '../model/segment'

type EditorState = {
    stations: Record<string, Station>
    segments: Record<string, Segment>

    addStation: (x: number, y: number) => void
    moveStation: (id: string, x: number, y: number) => void
    addSegment: (fromStationId: string, toStationId: string) => void
}

export const useEditorStore = create<EditorState>((set) => ({
    stations: {},
    segments: {},

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

    addSegment: (
        fromStationId,
        toStationId
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

            return {
                segments: {
                    ...state.segments,

                    [id]: {
                        id,

                        fromStationId,
                        toStationId,

                        points: [
                            {
                                x: from.x,
                                y: from.y,
                            },

                            {
                                x: to.x,
                                y: to.y,
                            },
                        ],
                    },
                },
            }
        }),

}))
