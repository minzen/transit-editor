import { useCallback } from 'react'
import { useEditorStore } from '../store/editorStore'
import { validateMapDocument } from '../validation/mapSchema'

export type ImportResult =
    | { success: true }
    | { success: false; errors: string[] }

export function useMapJSON() {
    const stations = useEditorStore((s) => s.stations)
    const segments = useEditorStore((s) => s.segments)
    const lines = useEditorStore((s) => s.lines)
    const shapes = useEditorStore((s) => s.shapes)
    const activeTool = useEditorStore((s) => s.activeTool)
    const lineWidth = useEditorStore((s) => s.lineWidth)
    const gridCellSize = useEditorStore((s) => s.gridCellSize)
    const gridCellsWidth = useEditorStore((s) => s.gridCellsWidth)
    const gridCellsHeight = useEditorStore((s) => s.gridCellsHeight)
    const showLineCodes = useEditorStore((s) => s.showLineCodes)
    const language = useEditorStore((s) => s.language)
    const viewport = useEditorStore((s) => s.viewport)

    const importMap = useEditorStore((s) => s.importMap)
    const setActiveTool = useEditorStore((s) => s.setActiveTool)
    const setLineWidth = useEditorStore((s) => s.setLineWidth)
    const setGridCellSize = useEditorStore((s) => s.setGridCellSize)
    const setGridCellsWidth = useEditorStore((s) => s.setGridCellsWidth)
    const setGridCellsHeight = useEditorStore((s) => s.setGridCellsHeight)
    const setShowLineCodes = useEditorStore((s) => s.setShowLineCodes)
    const setLanguage = useEditorStore((s) => s.setLanguage)
    const setViewport = useEditorStore((s) => s.setViewport)

    const exportAsJSON = useCallback(() => {
        const doc = {
            version: 1,
            stations,
            segments,
            lines,
            shapes,
            activeTool,
            lineWidth,
            gridCellSize,
            gridCellsWidth,
            gridCellsHeight,
            showLineCodes,
            language,
            viewport,
        }

        const json = JSON.stringify(doc, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'transit-map.json'
        link.click()
        URL.revokeObjectURL(url)
    }, [
        stations,
        segments,
        lines,
        shapes,
        activeTool,
        lineWidth,
        gridCellSize,
        gridCellsWidth,
        gridCellsHeight,
        showLineCodes,
        language,
        viewport,
    ])

    const handleImportFile = useCallback(
        (file: File): Promise<ImportResult> => {
            return new Promise((resolve) => {
                const reader = new FileReader()
                reader.onload = (event) => {
                    try {
                        const raw: unknown = JSON.parse(event.target?.result as string)
                        const result = validateMapDocument(raw)
                        if (!result.success) {
                            resolve({ success: false, errors: result.errors })
                            return
                        }

                        const data = result.data
                        importMap({
                            stations: data.stations,
                            segments: data.segments,
                            lines: data.lines,
                            shapes: data.shapes,
                        })

                        if (data.activeTool) setActiveTool(data.activeTool)
                        if (typeof data.lineWidth === 'number') setLineWidth(data.lineWidth)
                        if (typeof data.gridCellSize === 'number') setGridCellSize(data.gridCellSize)
                        if (typeof data.gridCellsWidth === 'number') setGridCellsWidth(data.gridCellsWidth)
                        if (typeof data.gridCellsHeight === 'number') setGridCellsHeight(data.gridCellsHeight)
                        if (typeof data.showLineCodes === 'boolean') setShowLineCodes(data.showLineCodes)
                        if (data.language) setLanguage(data.language)
                        if (data.viewport) setViewport(data.viewport)

                        resolve({ success: true })
                    } catch {
                        resolve({ success: false, errors: ['Invalid JSON file'] })
                    }
                }
                reader.onerror = () => {
                    resolve({ success: false, errors: ['Failed to read file'] })
                }
                reader.readAsText(file)
            })
        },
        [
            importMap,
            setActiveTool,
            setLineWidth,
            setGridCellSize,
            setGridCellsWidth,
            setGridCellsHeight,
            setShowLineCodes,
            setLanguage,
            setViewport,
        ]
    )

    const triggerImport = useCallback(() => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json,application/json'
        return new Promise<ImportResult>((resolve) => {
            input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (!file) {
                    resolve({ success: false, errors: ['No file selected'] })
                    return
                }
                void handleImportFile(file).then(resolve)
            }
            input.click()
        })
    }, [handleImportFile])

    return { exportAsJSON, triggerImport }
}
