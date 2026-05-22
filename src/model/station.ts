export type LabelPosition = 'top' | 'bottom' | 'left' | 'right'

export type Station = {
  id: string
  x: number
  y: number
  name?: string
  labelPosition?: LabelPosition
}
