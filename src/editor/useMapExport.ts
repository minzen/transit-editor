import { useCallback, useState } from 'react'
import type { RefObject } from 'react'

const EXPORT_PADDING = 40
export const PNG_EXPORT_SCALE = 2
export const MAX_PNG_EXPORT_DIMENSION = 16_384
export const MAX_PNG_EXPORT_PIXELS = 64_000_000

export function getPngExportDimensions(
    width: number,
    height: number,
    scale = PNG_EXPORT_SCALE,
): { width: number; height: number } {
    const scaledWidth = Math.ceil(width * scale)
    const scaledHeight = Math.ceil(height * scale)
    if (
        !Number.isFinite(scaledWidth)
        || !Number.isFinite(scaledHeight)
        || scaledWidth <= 0
        || scaledHeight <= 0
        || scaledWidth > MAX_PNG_EXPORT_DIMENSION
        || scaledHeight > MAX_PNG_EXPORT_DIMENSION
        || scaledWidth * scaledHeight > MAX_PNG_EXPORT_PIXELS
    ) {
        throw new Error('Map is too large to export as PNG')
    }
    return { width: scaledWidth, height: scaledHeight }
}

/**
 * Wait for fonts to load before drawing to canvas
 */
async function waitForFonts(): Promise<void> {
    await document.fonts.ready
    // Additional delay for any late-loading resources
    await new Promise((resolve) => setTimeout(resolve, 100))
}

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
        (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 50)),
        []
    )

    /**
     * Prepare SVG for export by creating a flattened copy with proper dimensions
     */
    const prepareExportSVG = useCallback((svgElement: SVGSVGElement): string => {
        // Get the content group (first <g> child which contains the viewport transform)
        const contentGroup = svgElement.querySelector('g')
        if (!contentGroup) {
            // Fallback: return serialized SVG as-is
            const serializer = new XMLSerializer()
            return serializer.serializeToString(svgElement)
        }

        // Get bounding box of all content (ignoring the viewport transform)
        const bbox = contentGroup.getBBox()

        // Create a new SVG with explicit dimensions
        const svgNS = 'http://www.w3.org/2000/svg'
        const exportSvg = document.createElementNS(svgNS, 'svg')
        exportSvg.setAttribute('xmlns', svgNS)
        exportSvg.setAttribute('width', String(Math.ceil(bbox.width + EXPORT_PADDING * 2)))
        exportSvg.setAttribute('height', String(Math.ceil(bbox.height + EXPORT_PADDING * 2)))
        exportSvg.setAttribute('viewBox', `${bbox.x - EXPORT_PADDING} ${bbox.y - EXPORT_PADDING} ${bbox.width + EXPORT_PADDING * 2} ${bbox.height + EXPORT_PADDING * 2}`)

        // Copy all styles from original SVG
        const computedStyle = window.getComputedStyle(svgElement)
        exportSvg.style.fontFamily = computedStyle.fontFamily
        exportSvg.style.fontSize = computedStyle.fontSize

        // Clone the content group and reset its transform
        const clonedGroup = contentGroup.cloneNode(true) as SVGGElement
        clonedGroup.removeAttribute('transform')
        exportSvg.appendChild(clonedGroup)

        // Copy defs (for any gradients, patterns, etc.)
        const defs = svgElement.querySelector('defs')
        if (defs) {
            const clonedDefs = defs.cloneNode(true)
            exportSvg.insertBefore(clonedDefs, clonedGroup)
        }

        // Add white background rect
        const bgRect = document.createElementNS(svgNS, 'rect')
        bgRect.setAttribute('x', String(bbox.x - EXPORT_PADDING))
        bgRect.setAttribute('y', String(bbox.y - EXPORT_PADDING))
        bgRect.setAttribute('width', String(bbox.width + EXPORT_PADDING * 2))
        bgRect.setAttribute('height', String(bbox.height + EXPORT_PADDING * 2))
        bgRect.setAttribute('fill', '#ffffff')
        exportSvg.insertBefore(bgRect, clonedGroup)

        const serializer = new XMLSerializer()
        return serializer.serializeToString(exportSvg)
    }, [])

    const exportAsSVG = useCallback(async () => {
        if (!svgRef.current) return

        hideExportFlags()
        await waitForRender()

        const svgElement = svgRef.current
        if (!svgElement) {
            resetExportFlags()
            return
        }

        const exportSvgString = prepareExportSVG(svgElement)

        const blob = new Blob([exportSvgString], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = url
        link.download = 'transit-map.svg'
        link.click()

        URL.revokeObjectURL(url)
        resetExportFlags()
    }, [svgRef, hideExportFlags, resetExportFlags, waitForRender, prepareExportSVG])

    const exportAsPNG = useCallback(async () => {
        if (!svgRef.current) return

        hideExportFlags()
        try {
            await waitForRender()
            await waitForFonts()

            const svgElement = svgRef.current
            if (!svgElement) return

            const exportSvgString = prepareExportSVG(svgElement)

            // Parse to get dimensions
            const parser = new DOMParser()
            const doc = parser.parseFromString(exportSvgString, 'image/svg+xml')
            const exportSvg = doc.documentElement
            const width = parseFloat(exportSvg.getAttribute('width') ?? '800')
            const height = parseFloat(exportSvg.getAttribute('height') ?? '600')
            const canvasDimensions = getPngExportDimensions(width, height)

            const svgBlob = new Blob([exportSvgString], { type: 'image/svg+xml;charset=utf-8' })
            const svgUrl = URL.createObjectURL(svgBlob)

            const img = new Image()
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas')
                    canvas.width = canvasDimensions.width
                    canvas.height = canvasDimensions.height

                    const ctx = canvas.getContext('2d')
                    if (ctx) {
                        ctx.scale(PNG_EXPORT_SCALE, PNG_EXPORT_SCALE)
                        ctx.fillStyle = '#ffffff'
                        ctx.fillRect(0, 0, width, height)
                        ctx.drawImage(img, 0, 0, width, height)

                        // Reset transform for clean export
                        ctx.setTransform(1, 0, 0, 1, 0, 0)

                        const pngUrl = canvas.toDataURL('image/png')
                        const link = document.createElement('a')
                        link.href = pngUrl
                        link.download = 'transit-map.png'
                        link.click()
                    }
                } finally {
                    URL.revokeObjectURL(svgUrl)
                    resetExportFlags()
                }
            }
            img.onerror = () => {
                URL.revokeObjectURL(svgUrl)
                resetExportFlags()
            }
            img.src = svgUrl
        } catch {
            resetExportFlags()
        }
    }, [svgRef, hideExportFlags, resetExportFlags, waitForRender, prepareExportSVG])

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
