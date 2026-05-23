import type { Point } from '../types/geometry'

export type Shape = {
    id: string
    /** Ordered polygon vertices in world coordinates. */
    points: Point[]
    /** Fill colour, e.g. '#a8d5e2' for water. */
    color: string
    /** Optional label shown in a legend. */
    name?: string
    /** Fill opacity 0–1. Defaults to 0.5. */
    opacity?: number
}
