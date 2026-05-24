import type { Point } from '../types/geometry'

export type Segment = {
  id: string

  fromStationId: string
  toStationId: string

  lineIds: string[]

  points: Point[]
}
