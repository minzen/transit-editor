/**
 * Utility functions for SVG export compatibility with external editors
 */

/**
 * Process SVG string for compatibility with external editors (Gimp, Inkscape, etc.)
 * Adds XML declaration, required attributes, and removes React-specific attributes
 */
export function processSVGForExport(
    svgString: string,
    bbox: { x: number; y: number; width: number; height: number }
): string {
    let processed = svgString

    // Add XML declaration
    processed = '<?xml version="1.0" encoding="UTF-8"?>\n' + processed

    // Ensure SVG has required attributes for compatibility with external editors
    // Add xmlns if missing
    if (!processed.includes('xmlns=')) {
        processed = processed.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
    }

    // Add viewBox if missing
    if (!processed.includes('viewBox=')) {
        const viewBox = `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`
        processed = processed.replace('<svg', `<svg viewBox="${viewBox}"`)
    }

    // Add width and height if missing
    if (!processed.includes('width=')) {
        processed = processed.replace('<svg', `<svg width="${bbox.width}" height="${bbox.height}"`)
    }

    // Remove React-specific attributes that external editors don't understand
    processed = processed.replace(/\sdata-[^=]*="[^"]*"/g, '')
    processed = processed.replace(/\saria-[^=]*="[^"]*"/g, '')

    return processed
}
