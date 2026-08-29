import { z } from 'zod'

export const MAP_IMPORT_LIMITS = {
    maxStations: 5_000,
    maxSegments: 10_000,
    maxLines: 500,
    maxShapes: 2_000,
    maxPointsPerSegment: 100,
    maxPointsPerShape: 500,
    maxLineIdsPerSegment: 32,
    maxServicesPerStation: 25,
    maxIdLength: 128,
    maxNameLength: 50,
    maxLineCodeLength: 20,
    maxCoordinate: 1_000_000,
} as const

const BoundedString = z.string().min(1).max(MAP_IMPORT_LIMITS.maxIdLength)
const BoundedCoordinate = z.number().finite().min(-MAP_IMPORT_LIMITS.maxCoordinate).max(MAP_IMPORT_LIMITS.maxCoordinate)

const PointSchema = z.object({
    x: BoundedCoordinate,
    y: BoundedCoordinate,
})

const LabelPositionSchema = z.enum(['top', 'bottom', 'left', 'right'])

const ServiceIconSchema = z.enum([
    // Legacy emoji icons
    'accessibility',
    'ferry',
    'rail',
    'airport',
    'toilet',
    // Material Design icons
    'accessible',
    'directions_boat',
    'train',
    'flight',
    'wc',
    'local_taxi',
    'directions_bus',
    'directions_subway',
    'tram',
    'directions_bike',
    'electric_car',
    'local_parking',
    'shopping',
    'restaurant',
    'cafe',
    'hotel',
    'local_hospital',
    'school',
    'museum',
    'park',
])

const StationSchema = z.object({
    id: BoundedString,
    x: BoundedCoordinate,
    y: BoundedCoordinate,
    name: z.string().max(MAP_IMPORT_LIMITS.maxNameLength).optional(),
    labelPosition: LabelPositionSchema.optional(),
    labelRotation: z.number().finite().min(-360).max(360).optional(),
    services: z.array(ServiceIconSchema).max(MAP_IMPORT_LIMITS.maxServicesPerStation).optional(),
    fareZone: z.number().finite().optional(),
})

const SegmentSchema = z.object({
    id: BoundedString,
    fromStationId: BoundedString,
    toStationId: BoundedString,
    lineIds: z.array(BoundedString).min(1).max(MAP_IMPORT_LIMITS.maxLineIdsPerSegment),
    points: z.array(PointSchema).min(2).max(MAP_IMPORT_LIMITS.maxPointsPerSegment),
})

const LineStyleSchema = z.enum(['solid', 'dashed', 'double'])
const TransitModeSchema = z.enum(['metro', 'rail', 'tram', 'bus', 'ferry'])

const LineSchema = z.object({
    id: BoundedString,
    name: z.string().min(1).max(MAP_IMPORT_LIMITS.maxNameLength),
    color: z.string().min(1).max(64),
    code: z.string().max(MAP_IMPORT_LIMITS.maxLineCodeLength).optional(),
    lineStyle: LineStyleSchema.optional(),
    transitMode: TransitModeSchema.optional(),
    lineWidth: z.number().int().min(1).max(20).optional(),
})

const ShapeSchema = z.object({
    id: BoundedString,
    points: z.array(PointSchema).min(3).max(MAP_IMPORT_LIMITS.maxPointsPerShape),
    color: z.string().min(1).max(64),
    name: z.string().max(MAP_IMPORT_LIMITS.maxNameLength).optional(),
    opacity: z.number().min(0).max(1).optional(),
})

const ViewportSchema = z.object({
    zoom: z.number().finite().min(0.1).max(100),
    offsetX: BoundedCoordinate,
    offsetY: BoundedCoordinate,
})

const EditorToolSchema = z.enum(['select', 'station', 'segment', 'shape'])

const boundedRecord = <T extends z.ZodType>(valueSchema: T, maxEntries: number) =>
    z.record(BoundedString, valueSchema).refine(
        (record) => Object.keys(record).length <= maxEntries,
        `Must contain at most ${maxEntries} entries`,
    )

const MapDocumentBaseSchema = z.object({
    version: z.literal(1),
    stations: boundedRecord(StationSchema, MAP_IMPORT_LIMITS.maxStations),
    segments: boundedRecord(SegmentSchema, MAP_IMPORT_LIMITS.maxSegments),
    lines: boundedRecord(LineSchema, MAP_IMPORT_LIMITS.maxLines),
    shapes: boundedRecord(ShapeSchema, MAP_IMPORT_LIMITS.maxShapes),
    activeTool: EditorToolSchema.optional(),
    lineWidth: z.number().finite().min(1).max(20).optional(),
    gridCellSize: z.number().finite().min(10).max(1_000).optional(),
    gridCellsWidth: z.number().finite().min(10).max(1_000).optional(),
    gridCellsHeight: z.number().finite().min(10).max(1_000).optional(),
    showLineCodes: z.boolean().optional(),
    freeformMode: z.boolean().optional(),
    language: z.enum(['en', 'de']).optional(),
    viewport: ViewportSchema.optional(),
})

function addRecordIdIssues(
    record: Record<string, { id: string }>,
    collection: 'stations' | 'segments' | 'lines' | 'shapes',
    ctx: z.RefinementCtx,
): void {
    for (const [key, entity] of Object.entries(record)) {
        if (key !== entity.id) {
            ctx.addIssue({
                code: 'custom',
                path: [collection, key, 'id'],
                message: `ID must match record key "${key}"`,
            })
        }
    }
}

export const MapDocumentSchema = MapDocumentBaseSchema.superRefine((document, ctx) => {
    addRecordIdIssues(document.stations, 'stations', ctx)
    addRecordIdIssues(document.segments, 'segments', ctx)
    addRecordIdIssues(document.lines, 'lines', ctx)
    addRecordIdIssues(document.shapes, 'shapes', ctx)

    for (const [segmentKey, segment] of Object.entries(document.segments)) {
        const path = ['segments', segmentKey] as const
        const fromStation = document.stations[segment.fromStationId]
        const toStation = document.stations[segment.toStationId]

        if (!fromStation) {
            ctx.addIssue({
                code: 'custom',
                path: [...path, 'fromStationId'],
                message: `Unknown station "${segment.fromStationId}"`,
            })
        }
        if (!toStation) {
            ctx.addIssue({
                code: 'custom',
                path: [...path, 'toStationId'],
                message: `Unknown station "${segment.toStationId}"`,
            })
        }
        if (segment.fromStationId === segment.toStationId) {
            ctx.addIssue({
                code: 'custom',
                path: [...path, 'toStationId'],
                message: 'Segment endpoints must reference different stations',
            })
        }

        const uniqueLineIds = new Set(segment.lineIds)
        if (uniqueLineIds.size !== segment.lineIds.length) {
            ctx.addIssue({
                code: 'custom',
                path: [...path, 'lineIds'],
                message: 'Segment line IDs must be unique',
            })
        }
        for (const [lineIndex, lineId] of segment.lineIds.entries()) {
            if (!document.lines[lineId]) {
                ctx.addIssue({
                    code: 'custom',
                    path: [...path, 'lineIds', lineIndex],
                    message: `Unknown line "${lineId}"`,
                })
            }
        }

        const firstPoint = segment.points[0]
        const lastPoint = segment.points[segment.points.length - 1]
        if (fromStation && (firstPoint.x !== fromStation.x || firstPoint.y !== fromStation.y)) {
            ctx.addIssue({
                code: 'custom',
                path: [...path, 'points', 0],
                message: 'First point must match the from-station coordinates',
            })
        }
        if (toStation && (lastPoint.x !== toStation.x || lastPoint.y !== toStation.y)) {
            ctx.addIssue({
                code: 'custom',
                path: [...path, 'points', segment.points.length - 1],
                message: 'Last point must match the to-station coordinates',
            })
        }
    }
})

export type MapDocument = z.infer<typeof MapDocumentSchema>

export type ValidationResult =
    | { success: true; data: MapDocument }
    | { success: false; errors: string[] }

export function validateMapDocument(value: unknown): ValidationResult {
    const result = MapDocumentSchema.safeParse(value)
    if (result.success) {
        return { success: true, data: result.data }
    }

    const errors: string[] = []
    for (const issue of result.error.issues) {
        const path = issue.path.length > 0 ? issue.path.join('.') : 'root'
        errors.push(`${path}: ${issue.message}`)
    }

    return { success: false, errors }
}
