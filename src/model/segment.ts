export type Segment = {
  id: string

  fromStationId: string
  toStationId: string

  points: {
    x: number
    y: number
  }[]
}
