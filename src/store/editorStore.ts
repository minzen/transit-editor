import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { Station } from '../model/station'


type EditorState = {
    stations: Record<string, Station>

    addStation: (x: number, y: number) => void
    moveStation: (id: string, x: number, y: number) => void
}

export const useEditorStore = create<EditorState>((set) => ({
    stations: {},

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
        set((state) => ({
            stations: {
                ...state.stations,
                [id]: {
                    ...state.stations[id],
                    x,
                    y,
                },
            },
        })),
}))
