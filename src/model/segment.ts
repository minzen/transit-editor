import type { Point } from '../types/geometry'

export type Segment = {
  id: string

  fromStationId: string
  toStationId: string

  lineId: string
  color: string

  points: Point[]
}
