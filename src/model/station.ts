export type LabelPosition = 'top' | 'bottom' | 'left' | 'right'

export type ServiceIcon = 
  // Legacy emoji-based icons
  | 'accessibility' | 'ferry' | 'rail' | 'airport' | 'toilet'
  // Elegant Material Design icons
  | 'accessible' | 'directions_boat' | 'train' | 'flight' | 'wc'
  | 'local_taxi' | 'directions_bus' | 'directions_subway' | 'tram' | 'directions_bike'
  | 'electric_car' | 'local_parking' | 'shopping' | 'restaurant' | 'cafe'
  | 'hotel' | 'local_hospital' | 'school' | 'museum' | 'park'

export type Station = {
  id: string
  x: number
  y: number
  name?: string
  labelPosition?: LabelPosition
  labelRotation?: number
  services?: ServiceIcon[]
}
