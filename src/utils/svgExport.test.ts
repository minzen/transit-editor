import { describe, expect, it } from 'vitest'
import { processSVGForExport } from './svgExport'

describe('processSVGForExport', () => {
    it('adds XML declaration to SVG string', () => {
        const svgString = '<svg></svg>'
        const bbox = { x: 0, y: 0, width: 100, height: 100 }
        const processed = processSVGForExport(svgString, bbox)

        expect(processed).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>\n/)
    })

    it('adds xmlns attribute if missing', () => {
        const svgString = '<svg></svg>'
        const bbox = { x: 0, y: 0, width: 100, height: 100 }
        const processed = processSVGForExport(svgString, bbox)

        expect(processed).toContain('xmlns="http://www.w3.org/2000/svg"')
    })

    it('does not add xmlns if already present', () => {
        const svgString = '<svg xmlns="http://www.w3.org/2000/svg"></svg>'
        const bbox = { x: 0, y: 0, width: 100, height: 100 }
        const processed = processSVGForExport(svgString, bbox)

        // Should only have one xmlns attribute
        const matches = processed.match(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g)
        expect(matches).toHaveLength(1)
    })

    it('adds viewBox attribute if missing', () => {
        const svgString = '<svg></svg>'
        const bbox = { x: 10, y: 20, width: 100, height: 50 }
        const processed = processSVGForExport(svgString, bbox)

        expect(processed).toContain('viewBox="10 20 100 50"')
    })

    it('does not add viewBox if already present', () => {
        const svgString = '<svg viewBox="0 0 200 150"></svg>'
        const bbox = { x: 10, y: 20, width: 100, height: 50 }
        const processed = processSVGForExport(svgString, bbox)

        // Should only have one viewBox attribute
        const matches = processed.match(/viewBox="[^"]*"/g)
        expect(matches).toHaveLength(1)
    })

    it('adds width and height attributes if missing', () => {
        const svgString = '<svg></svg>'
        const bbox = { x: 0, y: 0, width: 200, height: 150 }
        const processed = processSVGForExport(svgString, bbox)

        expect(processed).toContain('width="200"')
        expect(processed).toContain('height="150"')
    })

    it('does not add width and height if already present', () => {
        const svgString = '<svg width="300" height="250"></svg>'
        const bbox = { x: 0, y: 0, width: 200, height: 150 }
        const processed = processSVGForExport(svgString, bbox)

        // Should keep original width and height
        expect(processed).toContain('width="300"')
        expect(processed).toContain('height="250"')
    })

    it('removes data-* attributes', () => {
        const svgString = '<svg data-test="value" data-another="123"></svg>'
        const bbox = { x: 0, y: 0, width: 100, height: 100 }
        const processed = processSVGForExport(svgString, bbox)

        expect(processed).not.toContain('data-test')
        expect(processed).not.toContain('data-another')
    })

    it('removes aria-* attributes', () => {
        const svgString = '<svg aria-label="test" aria-hidden="true"></svg>'
        const bbox = { x: 0, y: 0, width: 100, height: 100 }
        const processed = processSVGForExport(svgString, bbox)

        expect(processed).not.toContain('aria-label')
        expect(processed).not.toContain('aria-hidden')
    })

    it('preserves other SVG attributes', () => {
        const svgString = '<svg fill="red" stroke="blue"></svg>'
        const bbox = { x: 0, y: 0, width: 100, height: 100 }
        const processed = processSVGForExport(svgString, bbox)

        expect(processed).toContain('fill="red"')
        expect(processed).toContain('stroke="blue"')
    })

    it('handles SVG with existing attributes', () => {
        const svgString = '<svg fill="red" stroke="blue" data-test="value"></svg>'
        const bbox = { x: 0, y: 0, width: 100, height: 100 }
        const processed = processSVGForExport(svgString, bbox)

        expect(processed).toContain('fill="red"')
        expect(processed).toContain('stroke="blue"')
        expect(processed).not.toContain('data-test')
    })
})
