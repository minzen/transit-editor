export type LabelPosition = 'top' | 'bottom' | 'left' | 'right'

export type ServiceIcon = 'accessibility' | 'ferry' | 'rail' | 'airport' | 'toilet'

export type Station = {
  id: string
  x: number
  y: number
  name?: string
  labelPosition?: LabelPosition
  labelRotation?: number
  services?: ServiceIcon[]
  fareZone?: number
}
