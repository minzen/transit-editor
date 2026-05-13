interface EditorStore {
  stations: Record<string, Station>

  viewport: Viewport

  activeTool: ToolType

  addStation(): void
}