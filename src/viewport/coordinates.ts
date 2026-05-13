type Viewport = {
  zoom: number
  offsetX: number
  offsetY: number
}

export function screenToWorld(
  x: number,
  y: number,
  viewport: Viewport
) {
  return {
    x: (x - viewport.offsetX) / viewport.zoom,
    y: (y - viewport.offsetY) / viewport.zoom,
  }
}
