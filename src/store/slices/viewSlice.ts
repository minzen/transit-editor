import type { StateCreator } from 'zustand'
import type { Viewport } from '../../viewport/coordinates'

export type ViewSlice = {
    viewport: Viewport
    lineWidth: number
    gridCellSize: number
    gridCellsWidth: number
    gridCellsHeight: number
    showLineCodes: boolean
    setViewport: (viewport: Viewport) => void
    zoomIn: (centerX?: number, centerY?: number) => void
    zoomOut: (centerX?: number, centerY?: number) => void
    resetViewport: () => void
    setLineWidth: (width: number) => void
    setGridCellSize: (size: number) => void
    setGridCellsWidth: (width: number) => void
    setGridCellsHeight: (height: number) => void
    setShowLineCodes: (show: boolean) => void
}

export const createViewSlice: StateCreator<ViewSlice, [], [], ViewSlice> = (set) => ({
    viewport: { zoom: 1, offsetX: 0, offsetY: 0 },
    lineWidth: 10,
    gridCellSize: 50,
    gridCellsWidth: 80,
    gridCellsHeight: 80,
    showLineCodes: true,

    setViewport: (viewport) =>
        set({ viewport }),

    zoomIn: (centerX?: number, centerY?: number) =>
        set((state) => {
            const oldZoom = state.viewport.zoom
            const newZoom = Math.min(10, oldZoom * 1.15)
            const zoomRatio = newZoom / oldZoom

            if (centerX !== undefined && centerY !== undefined) {
                return {
                    viewport: {
                        zoom: newZoom,
                        offsetX: centerX - (centerX - state.viewport.offsetX) * zoomRatio,
                        offsetY: centerY - (centerY - state.viewport.offsetY) * zoomRatio,
                    },
                }
            }

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

            if (centerX !== undefined && centerY !== undefined) {
                return {
                    viewport: {
                        zoom: newZoom,
                        offsetX: centerX - (centerX - state.viewport.offsetX) * zoomRatio,
                        offsetY: centerY - (centerY - state.viewport.offsetY) * zoomRatio,
                    },
                }
            }

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

    setGridCellSize: (size) =>
        set(() => ({
            gridCellSize: Math.max(10, Math.min(1000, size)),
        })),

    setGridCellsWidth: (width) =>
        set(() => ({
            gridCellsWidth: Math.max(10, Math.min(1000, width)),
        })),

    setGridCellsHeight: (height) =>
        set(() => ({
            gridCellsHeight: Math.max(10, Math.min(1000, height)),
        })),

    setShowLineCodes: (show) =>
        set({ showLineCodes: show }),
})
