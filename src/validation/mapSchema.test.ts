import { describe, expect, it } from 'vitest'
import { validateMapDocument, MapDocumentSchema } from './mapSchema'

function validDoc() {
    return {
        version: 1,
        stations: {
            st1: { id: 'st1', x: 0, y: 0, name: 'Station 1' },
        },
        segments: {
            seg1: { id: 'seg1', fromStationId: 'st1', toStationId: 'st1', lineIds: ['l1'], points: [{ x: 0, y: 0 }] },
        },
        lines: {
            l1: { id: 'l1', name: 'Line 1', color: '#ff0000' },
        },
        shapes: {
            sh1: { id: 'sh1', points: [{ x: 0, y: 0 }], color: '#00ff00' },
        },
    }
}

describe('validateMapDocument', () => {
    it('accepts a valid minimal document', () => {
        const result = validateMapDocument(validDoc())
        expect(result.success).toBe(true)
    })

    it('accepts a valid full document with optional fields', () => {
        const doc = {
            ...validDoc(),
            activeTool: 'station',
            lineWidth: 12,
            gridCellSize: 60,
            gridCellsWidth: 100,
            gridCellsHeight: 100,
            showLineCodes: false,
            language: 'de',
            viewport: { zoom: 1.5, offsetX: 100, offsetY: 200 },
        }
        const result = validateMapDocument(doc)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.language).toBe('de')
            expect(result.data.viewport?.zoom).toBe(1.5)
        }
    })

    it('rejects wrong version', () => {
        const result = validateMapDocument({ ...validDoc(), version: 2 })
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.errors.some((e) => e.includes('version'))).toBe(true)
        }
    })

    it('rejects missing stations', () => {
        const doc = { ...validDoc() } as Record<string, unknown>
        delete doc.stations
        const result = validateMapDocument(doc)
        expect(result.success).toBe(false)
    })

    it('rejects invalid station id', () => {
        const doc = {
            ...validDoc(),
            stations: { '': { id: '', x: 0, y: 0 } },
        }
        const result = validateMapDocument(doc)
        expect(result.success).toBe(false)
    })

    it('rejects invalid segment with missing lineIds', () => {
        const doc = {
            ...validDoc(),
            segments: {
                seg1: { id: 'seg1', fromStationId: 'st1', toStationId: 'st1', points: [] },
            },
        }
        const result = validateMapDocument(doc)
        expect(result.success).toBe(false)
    })

    it('rejects invalid line color', () => {
        const doc = {
            ...validDoc(),
            lines: { l1: { id: 'l1', name: 'Line 1', color: '' } },
        }
        const result = validateMapDocument(doc)
        expect(result.success).toBe(false)
    })

    it('rejects invalid shape opacity out of range', () => {
        const doc = {
            ...validDoc(),
            shapes: {
                sh1: { id: 'sh1', points: [{ x: 0, y: 0 }], color: '#00ff00', opacity: 1.5 },
            },
        }
        const result = validateMapDocument(doc)
        expect(result.success).toBe(false)
    })

    it('rejects invalid activeTool value', () => {
        const result = validateMapDocument({ ...validDoc(), activeTool: 'pan' })
        expect(result.success).toBe(false)
    })

    it('rejects non-object input', () => {
        const result = validateMapDocument('not an object')
        expect(result.success).toBe(false)
    })
})

describe('MapDocumentSchema', () => {
    it('allows all service icons', () => {
        const doc = validDoc() as Record<string, unknown>
        const stations = { ...doc.stations as Record<string, unknown> }
        stations.st1 = { ...stations.st1 as Record<string, unknown>, services: ['accessibility', 'ferry', 'rail', 'airport', 'toilet'] }
        doc.stations = stations
        const result = MapDocumentSchema.safeParse(doc)
        expect(result.success).toBe(true)
    })

    it('allows all line styles', () => {
        const doc = validDoc() as Record<string, unknown>
        const lines = { ...doc.lines as Record<string, unknown> }
        lines.l1 = { ...lines.l1 as Record<string, unknown>, lineStyle: 'double' }
        doc.lines = lines
        const result = MapDocumentSchema.safeParse(doc)
        expect(result.success).toBe(true)
    })

    it('allows all transit modes', () => {
        const doc = validDoc() as Record<string, unknown>
        const lines = { ...doc.lines as Record<string, unknown> }
        lines.l1 = { ...lines.l1 as Record<string, unknown>, transitMode: 'ferry' }
        doc.lines = lines
        const result = MapDocumentSchema.safeParse(doc)
        expect(result.success).toBe(true)
    })
})
