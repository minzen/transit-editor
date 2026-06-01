import { useCallback, useState } from 'react'
import type { RefObject } from 'react'
import { processSVGForExport } from '../utils/svgExport'

const EXPORT_PADDING = 40

/**
 * Hook providing SVG export, PNG export, and browser print of an SVG element.
 * Temporarily hides the grid, selection, and interactive handles during export/print
 * by toggling visibility flags, then re-enabling them afterward.
 */
export function useMapExport(svgRef: RefObject<SVGSVGElement | null>) {
    const [showGridForExport, setShowGridForExport] = useState(true)
    const [showSelectionForExport, setShowSelectionForExport] = useState(true)
    const [showInteractiveHandlesForExport, setShowInteractiveHandlesForExport] = useState(true)

    const resetExportFlags = useCallback(() => {
        setShowGridForExport(true)
        setShowSelectionForExport(true)
        setShowInteractiveHandlesForExport(true)
    }, [])

    const hideExportFlags = useCallback(() => {
        setShowGridForExport(false)
        setShowSelectionForExport(false)
        setShowInteractiveHandlesForExport(false)
    }, [])

    /**
     * Wait one macrotask so React can flush the state update that hides
     * interactive elements before we snapshot or print.
     */
    const waitForRender = useCallback(
        (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0)),
        []
    )

    const exportAsSVG = useCallback(async () => {
        if (!svgRef.current) return

        hideExportFlags()
        await waitForRender()

        const svgElement = svgRef.current
        if (!svgElement) {
            resetExportFlags()
            return
        }

        const serializer = new XMLSerializer()
        const svgString = serializer.serializeToString(svgElement)

        const bbox = svgElement.getBBox()
        const processedSVG = processSVGForExport(svgString, bbox)

        const blob = new Blob([processedSVG], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = url
        link.download = 'transit-map.svg'
        link.click()

        URL.revokeObjectURL(url)
        resetExportFlags()
    }, [svgRef, hideExportFlags, resetExportFlags, waitForRender])

    const exportAsPNG = useCallback(async () => {
        if (!svgRef.current) return

        hideExportFlags()
        await waitForRender()

        const svgElement = svgRef.current
        if (!svgElement) {
            resetExportFlags()
            return
        }

        const serializer = new XMLSerializer()
        const svgString = serializer.serializeToString(svgElement)

        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
        const svgUrl = URL.createObjectURL(svgBlob)

        const img = new Image()
        img.onload = () => {
            const canvas = document.createElement('canvas')
            const bbox = svgElement.getBBox()

            canvas.width = bbox.width + EXPORT_PADDING * 2
            canvas.height = bbox.height + EXPORT_PADDING * 2

            const ctx = canvas.getContext('2d')
            if (ctx) {
                ctx.fillStyle = '#ffffff'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
                ctx.drawImage(img, -bbox.x + EXPORT_PADDING, -bbox.y + EXPORT_PADDING, bbox.width, bbox.height)

                const pngUrl = canvas.toDataURL('image/png')
                const link = document.createElement('a')
                link.href = pngUrl
                link.download = 'transit-map.png'
                link.click()
            }

            URL.revokeObjectURL(svgUrl)
            resetExportFlags()
        }
        img.src = svgUrl
    }, [svgRef, hideExportFlags, resetExportFlags, waitForRender])

    const print = useCallback(async () => {
        if (!svgRef.current) return

        hideExportFlags()
        await waitForRender()

        // Restore UI after the print dialog closes (handles Cancel too)
        window.addEventListener('afterprint', resetExportFlags, { once: true })
        window.print()
    }, [svgRef, hideExportFlags, resetExportFlags, waitForRender])

    return {
        showGridForExport,
        showSelectionForExport,
        showInteractiveHandlesForExport,
        exportAsSVG,
        exportAsPNG,
        print,
    }
}
