import type { StateCreator } from 'zustand'
import type { Viewport } from '../../viewport/coordinates'

export type ViewSlice = {
    viewport: Viewport
    lineWidth: number
    gridCellSize: number
    gridCellsWidth: number
    gridCellsHeight: number
    showLineCodes: boolean
    language: 'en' | 'de'
    backgroundImageUrl: string | null
    showBackgroundImage: boolean
    backgroundImageX: number
    backgroundImageY: number
    backgroundImageWidth: number
    backgroundImageHeight: number
    backgroundImageOpacity: number
    themeMode: 'light' | 'dark'
    setViewport: (viewport: Viewport) => void
    zoomIn: (centerX?: number, centerY?: number) => void
    zoomOut: (centerX?: number, centerY?: number) => void
    resetViewport: () => void
    setLineWidth: (width: number) => void
    setGridCellSize: (size: number) => void
    setGridCellsWidth: (width: number) => void
    setGridCellsHeight: (height: number) => void
    setShowLineCodes: (show: boolean) => void
    setLanguage: (lang: 'en' | 'de') => void
    setBackgroundImageUrl: (url: string | null) => void
    setShowBackgroundImage: (show: boolean) => void
    setBackgroundImageX: (x: number) => void
    setBackgroundImageY: (y: number) => void
    setBackgroundImageWidth: (width: number) => void
    setBackgroundImageHeight: (height: number) => void
    setBackgroundImageOpacity: (opacity: number) => void
    setThemeMode: (mode: 'light' | 'dark') => void
}

export const createViewSlice: StateCreator<ViewSlice, [], [], ViewSlice> = (set) => ({
    viewport: { zoom: 1, offsetX: 0, offsetY: 0 },
    lineWidth: 10,
    gridCellSize: 50,
    gridCellsWidth: 80,
    gridCellsHeight: 80,
    showLineCodes: true,
    language: 'en',
    backgroundImageUrl: null,
    showBackgroundImage: true,
    backgroundImageX: 0,
    backgroundImageY: 0,
    backgroundImageWidth: 4000,
    backgroundImageHeight: 4000,
    backgroundImageOpacity: 0.3,
    themeMode: 'light',

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

    setLanguage: (lang) =>
        set({ language: lang }),

    setBackgroundImageUrl: (url) =>
        set({ backgroundImageUrl: url }),

    setShowBackgroundImage: (show) =>
        set({ showBackgroundImage: show }),

    setBackgroundImageX: (x) =>
        set({ backgroundImageX: x }),

    setBackgroundImageY: (y) =>
        set({ backgroundImageY: y }),

    setBackgroundImageWidth: (width) =>
        set(() => ({
            backgroundImageWidth: Math.max(1, width),
        })),

    setBackgroundImageHeight: (height) =>
        set(() => ({
            backgroundImageHeight: Math.max(1, height),
        })),

    setBackgroundImageOpacity: (opacity) =>
        set(() => ({
            backgroundImageOpacity: Math.max(0, Math.min(1, opacity)),
        })),

    setThemeMode: (mode) =>
        set({ themeMode: mode }),
})
