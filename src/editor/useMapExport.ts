import { useCallback, useState } from 'react'
import type { RefObject } from 'react'
import { processSVGForExport } from '../utils/svgExport'

const EXPORT_PADDING = 40

/**
 * Hook providing SVG and PNG export of an SVG element. Hides the grid during
 * export by toggling `showGridForExport` to false, then re-enabling it after the
 * download is triggered.
 */
export function useMapExport(svgRef: RefObject<SVGSVGElement | null>) {
    const [showGridForExport, setShowGridForExport] = useState(true)
    const [showSelectionForExport, setShowSelectionForExport] = useState(true)

    const exportAsSVG = useCallback(() => {
        if (!svgRef.current) return

        setShowGridForExport(false)
        setShowSelectionForExport(false)

        // Wait for re-render before exporting
        setTimeout(() => {
            const svgElement = svgRef.current
            if (!svgElement) {
                setShowGridForExport(true)
                setShowSelectionForExport(true)
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

            setShowGridForExport(true)
            setShowSelectionForExport(true)
        }, 0)
    }, [svgRef])

    const exportAsPNG = useCallback(() => {
        if (!svgRef.current) return

        setShowGridForExport(false)
        setShowSelectionForExport(false)

        setTimeout(() => {
            const svgElement = svgRef.current
            if (!svgElement) {
                setShowGridForExport(true)
                setShowSelectionForExport(true)
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
                setShowGridForExport(true)
                setShowSelectionForExport(true)
            }
            img.src = svgUrl
        }, 0)
    }, [svgRef])

    return {
        showGridForExport,
        showSelectionForExport,
        exportAsSVG,
        exportAsPNG,
    }
}
