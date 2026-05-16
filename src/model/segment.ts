export type Segment = {
  id: string

  fromStationId: string
  toStationId: string

  color: string

  points: {
    x: number
    y: number
  }[]
}
