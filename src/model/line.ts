export type LineStyle = 'solid' | 'dashed' | 'double'

export type TransitMode = 'metro' | 'rail' | 'tram' | 'bus' | 'ferry'

export type Line = {
  id: string
  name: string
  color: string
  /**
   * Optional short code shown as a coloured "bullet" badge next to stations,
   * e.g. "M1", "6", "A". Empty or undefined hides the badge.
   */
  code?: string
  /** Visual stroke style: solid, dashed, or double (cased). Defaults to solid. */
  lineStyle?: LineStyle
  /** Transit mode for filtering / future legend. Defaults to metro. */
  transitMode?: TransitMode
  /** Per-line stroke width override. Falls back to the global lineWidth setting when absent. */
  lineWidth?: number
}
