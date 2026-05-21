export type Line = {
  id: string
  name: string
  color: string
  /**
   * Optional short code shown as a coloured "bullet" badge next to stations,
   * e.g. "M1", "6", "A". Empty or undefined hides the badge.
   */
  code?: string
}
