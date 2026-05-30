import { z } from 'zod'

const PointSchema = z.object({
    x: z.number(),
    y: z.number(),
})

const LabelPositionSchema = z.enum(['top', 'bottom', 'left', 'right'])

const ServiceIconSchema = z.enum([
    'accessibility',
    'ferry',
    'rail',
    'airport',
    'toilet',
])

const StationSchema = z.object({
    id: z.string().min(1),
    x: z.number(),
    y: z.number(),
    name: z.string().optional(),
    labelPosition: LabelPositionSchema.optional(),
    labelRotation: z.number().optional(),
    services: z.array(ServiceIconSchema).optional(),
    fareZone: z.number().optional(),
})

const SegmentSchema = z.object({
    id: z.string().min(1),
    fromStationId: z.string().min(1),
    toStationId: z.string().min(1),
    lineIds: z.array(z.string().min(1)),
    points: z.array(PointSchema),
})

const LineStyleSchema = z.enum(['solid', 'dashed', 'double'])
const TransitModeSchema = z.enum(['metro', 'rail', 'tram', 'bus', 'ferry'])

const LineSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    color: z.string().min(1),
    code: z.string().optional(),
    lineStyle: LineStyleSchema.optional(),
    transitMode: TransitModeSchema.optional(),
})

const ShapeSchema = z.object({
    id: z.string().min(1),
    points: z.array(PointSchema),
    color: z.string().min(1),
    name: z.string().optional(),
    opacity: z.number().min(0).max(1).optional(),
})

const ViewportSchema = z.object({
    zoom: z.number(),
    offsetX: z.number(),
    offsetY: z.number(),
})

const EditorToolSchema = z.enum(['select', 'station', 'segment', 'shape'])

export const MapDocumentSchema = z.object({
    version: z.literal(1),
    stations: z.record(z.string().min(1), StationSchema),
    segments: z.record(z.string().min(1), SegmentSchema),
    lines: z.record(z.string().min(1), LineSchema),
    shapes: z.record(z.string().min(1), ShapeSchema),
    activeTool: EditorToolSchema.optional(),
    lineWidth: z.number().optional(),
    gridCellSize: z.number().optional(),
    gridCellsWidth: z.number().optional(),
    gridCellsHeight: z.number().optional(),
    showLineCodes: z.boolean().optional(),
    language: z.enum(['en', 'de']).optional(),
    viewport: ViewportSchema.optional(),
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
