import { describe, expect, it } from 'vitest'
import { validateMapDocument, MapDocumentSchema, MAP_IMPORT_LIMITS } from './mapSchema'

function validDoc() {
    return {
        version: 1,
        stations: {
            st1: { id: 'st1', x: 0, y: 0, name: 'Station 1' },
            st2: { id: 'st2', x: 100, y: 100, name: 'Station 2' },
        },
        segments: {
            seg1: { id: 'seg1', fromStationId: 'st1', toStationId: 'st2', lineIds: ['l1'], points: [{ x: 0, y: 0 }, { x: 100, y: 100 }] },
        },
        lines: {
            l1: { id: 'l1', name: 'Line 1', color: '#ff0000' },
        },
        shapes: {
            sh1: { id: 'sh1', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 0, y: 100 }], color: '#00ff00' },
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
        if (result.success === false) {
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

    it('rejects entity IDs that do not match their record keys', () => {
        const doc = {
            ...validDoc(),
            stations: {
                ...validDoc().stations,
                st1: { id: 'different-id', x: 0, y: 0 },
            },
        }

        const result = validateMapDocument(doc)
        expect(result.success).toBe(false)
        if (result.success === false) {
            expect(result.errors).toContain('stations.st1.id: ID must match record key "st1"')
        }
    })

    it('rejects segments that reference missing stations or lines', () => {
        const doc = {
            ...validDoc(),
            segments: {
                seg1: {
                    id: 'seg1',
                    fromStationId: 'missing-station',
                    toStationId: 'st2',
                    lineIds: ['missing-line'],
                    points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
                },
            },
        }

        const result = validateMapDocument(doc)
        expect(result.success).toBe(false)
        if (result.success === false) {
            expect(result.errors.some((error) => error.includes('segments.seg1.fromStationId: Unknown station'))).toBe(true)
            expect(result.errors.some((error) => error.includes('segments.seg1.lineIds.0: Unknown line'))).toBe(true)
        }
    })

    it('rejects self-loop segments and duplicate line references', () => {
        const doc = {
            ...validDoc(),
            segments: {
                seg1: {
                    id: 'seg1',
                    fromStationId: 'st1',
                    toStationId: 'st1',
                    lineIds: ['l1', 'l1'],
                    points: [{ x: 0, y: 0 }, { x: 0, y: 0 }],
                },
            },
        }

        const result = validateMapDocument(doc)
        expect(result.success).toBe(false)
        if (result.success === false) {
            expect(result.errors.some((error) => error.includes('endpoints must reference different stations'))).toBe(true)
            expect(result.errors.some((error) => error.includes('line IDs must be unique'))).toBe(true)
        }
    })

    it('rejects segment paths whose endpoints do not match their stations', () => {
        const doc = {
            ...validDoc(),
            segments: {
                seg1: {
                    ...validDoc().segments.seg1,
                    points: [{ x: 1, y: 0 }, { x: 100, y: 99 }],
                },
            },
        }

        const result = validateMapDocument(doc)
        expect(result.success).toBe(false)
        if (result.success === false) {
            expect(result.errors.some((error) => error.includes('First point must match'))).toBe(true)
            expect(result.errors.some((error) => error.includes('Last point must match'))).toBe(true)
        }
    })

    it('rejects insufficient segment and shape geometry', () => {
        const withShortSegment = {
            ...validDoc(),
            segments: {
                seg1: { ...validDoc().segments.seg1, points: [{ x: 0, y: 0 }] },
            },
        }
        const withShortShape = {
            ...validDoc(),
            shapes: {
                sh1: { ...validDoc().shapes.sh1, points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
            },
        }

        expect(validateMapDocument(withShortSegment).success).toBe(false)
        expect(validateMapDocument(withShortShape).success).toBe(false)
    })

    it('rejects non-object input', () => {
        const result = validateMapDocument('not an object')
        expect(result.success).toBe(false)
    })

    it('rejects records that exceed collection limits', () => {
        const stations = Object.fromEntries(
            Array.from({ length: MAP_IMPORT_LIMITS.maxStations + 1 }, (_, index) => {
                const id = `station-${index}`
                return [id, { id, x: 0, y: 0 }]
            })
        )

        expect(validateMapDocument({ ...validDoc(), stations }).success).toBe(false)
    })

    it('rejects excessive segment geometry and coordinates outside the map bounds', () => {
        const points = Array.from(
            { length: MAP_IMPORT_LIMITS.maxPointsPerSegment + 1 },
            () => ({ x: 0, y: 0 })
        )
        const withTooManyPoints = {
            ...validDoc(),
            segments: {
                seg1: { id: 'seg1', fromStationId: 'st1', toStationId: 'st1', lineIds: ['l1'], points },
            },
        }
        const withOutOfBoundsCoordinate = {
            ...validDoc(),
            stations: {
                st1: { id: 'st1', x: MAP_IMPORT_LIMITS.maxCoordinate + 1, y: 0 },
            },
        }

        expect(validateMapDocument(withTooManyPoints).success).toBe(false)
        expect(validateMapDocument(withOutOfBoundsCoordinate).success).toBe(false)
    })

    it('rejects IDs and names that exceed their limits', () => {
        const tooLong = 'x'.repeat(MAP_IMPORT_LIMITS.maxIdLength + 1)
        const tooLongName = 'x'.repeat(MAP_IMPORT_LIMITS.maxNameLength + 1)
        const withLongId = {
            ...validDoc(),
            stations: { [tooLong]: { id: tooLong, x: 0, y: 0 } },
        }
        const withLongName = {
            ...validDoc(),
            lines: { l1: { id: 'l1', name: tooLongName, color: '#ff0000' } },
        }

        expect(validateMapDocument(withLongId).success).toBe(false)
        expect(validateMapDocument(withLongName).success).toBe(false)
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

    it('allows per-line lineWidth within valid range', () => {
        const doc = validDoc() as Record<string, unknown>
        const lines = { ...doc.lines as Record<string, unknown> }
        lines.l1 = { ...lines.l1 as Record<string, unknown>, lineWidth: 6 }
        doc.lines = lines
        const result = MapDocumentSchema.safeParse(doc)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.lines.l1.lineWidth).toBe(6)
        }
    })

    it('rejects per-line lineWidth out of range', () => {
        const doc = validDoc() as Record<string, unknown>
        const lines = { ...doc.lines as Record<string, unknown> }
        lines.l1 = { ...lines.l1 as Record<string, unknown>, lineWidth: 25 }
        doc.lines = lines
        const result = MapDocumentSchema.safeParse(doc)
        expect(result.success).toBe(false)
    })
})
