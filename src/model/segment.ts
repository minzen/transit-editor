export type Segment = {
  id: string

  fromStationId: string
  toStationId: string

  lineId: string
  color: string

  points: {
    x: number
    y: number
  }[]
}
