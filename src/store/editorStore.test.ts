import { beforeEach, describe, expect, it } from 'vitest'
import { useEditorStore } from './editorStore'

describe('editor store', () => {
  beforeEach(() => {
    useEditorStore.setState({
      activeTool: 'select',
      stations: {},
      segments: {},
      lines: {},
      shapes: {},
      pastStates: [],
      futureStates: [],
    })
  })

  it('starts with empty state', () => {
    const state = useEditorStore.getState()

    expect(state.activeTool).toBe('select')
    expect(Object.keys(state.stations)).toHaveLength(0)
    expect(Object.keys(state.segments)).toHaveLength(0)
  })

  it('adds a station', () => {
    useEditorStore.getState().addStation(100, 200)

    const state = useEditorStore.getState()

    const stationIds = Object.keys(state.stations)
    expect(stationIds).toHaveLength(1)

    const station = state.stations[stationIds[0]]
    expect(station.x).toBe(100)
    expect(station.y).toBe(200)
  })

  it('moves a station', () => {
    useEditorStore.getState().addStation(100, 200)

    const state = useEditorStore.getState()
    const stationId = Object.keys(state.stations)[0]

    useEditorStore.getState().moveStation(stationId, 300, 400)

    const updatedState = useEditorStore.getState()
    expect(updatedState.stations[stationId].x).toBe(300)
    expect(updatedState.stations[stationId].y).toBe(400)
  })

  it('adds a segment', () => {
    useEditorStore.getState().addStation(100, 200)
    useEditorStore.getState().addStation(320, 250)

    const state = useEditorStore.getState()
    const stationIds = Object.keys(state.stations)

    useEditorStore.getState().addLine('Line 1', '#ff0000')
    const lineId = Object.keys(useEditorStore.getState().lines)[0]

    useEditorStore
      .getState()
      .addSegment(stationIds[0], stationIds[1], lineId)

    const updatedState = useEditorStore.getState()
    const segmentIds = Object.keys(updatedState.segments)

    expect(segmentIds).toHaveLength(1)
    expect(updatedState.segments[segmentIds[0]].fromStationId).toBe(stationIds[0])
    expect(updatedState.segments[segmentIds[0]].toStationId).toBe(stationIds[1])
  })

  it('adds a segment between two stations (L-shaped)', () => {
    useEditorStore.getState().addStation(100, 200)
    useEditorStore.getState().addStation(320, 250)

    const state = useEditorStore.getState()
    const stationIds = Object.keys(state.stations)

    useEditorStore.getState().addLine('Line 1', '#00ff00')
    const lineId = Object.keys(useEditorStore.getState().lines)[0]

    useEditorStore
      .getState()
      .addSegment(stationIds[0], stationIds[1], lineId)

    const updatedState = useEditorStore.getState()
    const segmentIds = Object.keys(updatedState.segments)

    expect(segmentIds).toHaveLength(1)

    const segment = updatedState.segments[segmentIds[0]]
    expect(segment.fromStationId).toBe(stationIds[0])
    expect(segment.toStationId).toBe(stationIds[1])
    expect(segment.lineIds).toEqual([lineId])
    expect(segment.points).toHaveLength(3)
  })

  it('updates segment points when a station is moved', () => {
    useEditorStore.getState().addStation(100, 200)
    useEditorStore.getState().addStation(300, 400)

    const state = useEditorStore.getState()
    const stationIds = Object.keys(state.stations)

    useEditorStore.getState().addLine('Line 1', '#0000ff')
    const lineId = Object.keys(useEditorStore.getState().lines)[0]

    useEditorStore
      .getState()
      .addSegment(stationIds[0], stationIds[1], lineId)

    useEditorStore.getState().moveStation(stationIds[0], 150, 250)

    const updatedState = useEditorStore.getState()
    const segmentIds = Object.keys(updatedState.segments)
    const segment = updatedState.segments[segmentIds[0]]

    expect(segment.points[0].x).toBe(150)
    expect(segment.points[0].y).toBe(250)
  })

  it('sets the active tool', () => {
    useEditorStore.getState().setActiveTool('station')

    const state = useEditorStore.getState()
    expect(state.activeTool).toBe('station')
  })

  it('does nothing when moving a non-existent station', () => {
    const initialState = useEditorStore.getState()

    useEditorStore.getState().moveStation('non-existent', 100, 200)

    const updatedState = useEditorStore.getState()
    expect(updatedState).toEqual(initialState)
  })

  it('does nothing when adding a segment with non-existent stations', () => {
    const initialState = useEditorStore.getState()

    useEditorStore
      .getState()
      .addSegment('non-existent-1', 'non-existent-2', 'non-existent-line')

    const updatedState = useEditorStore.getState()
    expect(updatedState).toEqual(initialState)
  })

  it('sets a station name', () => {
    useEditorStore.getState().addStation(100, 200)

    const state = useEditorStore.getState()
    const stationId = Object.keys(state.stations)[0]

    useEditorStore.getState().setStationName(stationId, 'Central Station')

    const updatedState = useEditorStore.getState()
    expect(updatedState.stations[stationId].name).toBe('Central Station')
  })

  it('does nothing when setting name for non-existent station', () => {
    const initialState = useEditorStore.getState()

    useEditorStore.getState().setStationName('non-existent', 'Test')

    const updatedState = useEditorStore.getState()
    expect(updatedState).toEqual(initialState)
  })

  it('sets station label position', () => {
    useEditorStore.getState().addStation(100, 200)

    const state = useEditorStore.getState()
    const stationId = Object.keys(state.stations)[0]

    useEditorStore.getState().setStationLabelPosition(stationId, 'right')

    const updatedState = useEditorStore.getState()
    expect(updatedState.stations[stationId].labelPosition).toBe('right')
  })

  it('does nothing when setting label position for non-existent station', () => {
    const initialState = useEditorStore.getState()

    useEditorStore.getState().setStationLabelPosition('non-existent', 'bottom')

    const updatedState = useEditorStore.getState()
    expect(updatedState).toEqual(initialState)
  })

  it('updates a segment point', () => {
    useEditorStore.getState().addStation(100, 200)
    useEditorStore.getState().addStation(320, 250)

    const state = useEditorStore.getState()
    const stationIds = Object.keys(state.stations)

    useEditorStore.getState().addLine('Line 1', '#00ff00')
    const lineId = Object.keys(useEditorStore.getState().lines)[0]

    useEditorStore
      .getState()
      .addSegment(stationIds[0], stationIds[1], lineId)

    const segmentState = useEditorStore.getState()
    const segmentId = Object.keys(segmentState.segments)[0]
    const segment = segmentState.segments[segmentId]

    expect(segment.points).toHaveLength(3)

    useEditorStore
      .getState()
      .updateSegmentPoint(segmentId, 1, 200, 220)

    const updatedState = useEditorStore.getState()
    const updatedSegment = updatedState.segments[segmentId]

    expect(updatedSegment.points[1].x).toBe(200)
    expect(updatedSegment.points[1].y).toBe(220)
  })

  it('does nothing when updating point with invalid index', () => {
    useEditorStore.getState().addStation(100, 200)
    useEditorStore.getState().addStation(320, 250)

    const state = useEditorStore.getState()
    const stationIds = Object.keys(state.stations)

    useEditorStore.getState().addLine('Line 1', '#00ff00')
    const lineId = Object.keys(useEditorStore.getState().lines)[0]

    useEditorStore
      .getState()
      .addSegment(stationIds[0], stationIds[1], lineId)

    const segmentState = useEditorStore.getState()
    const segmentId = Object.keys(segmentState.segments)[0]
    const initialState = segmentState.segments[segmentId]

    useEditorStore
      .getState()
      .updateSegmentPoint(segmentId, 5, 200, 220)

    const updatedState = useEditorStore.getState()
    const updatedSegment = updatedState.segments[segmentId]

    expect(updatedSegment).toEqual(initialState)
  })

  it('insertBendPoint adds a new vertex into the closest segment edge', () => {
    useEditorStore.getState().addStation(0, 0)
    useEditorStore.getState().addStation(200, 0)

    const stationIds = Object.keys(useEditorStore.getState().stations)
    useEditorStore.getState().addLine('Line 1', '#00ff00')
    const lineId = Object.keys(useEditorStore.getState().lines)[0]
    useEditorStore.getState().addSegment(stationIds[0], stationIds[1], lineId)

    const segmentId = Object.keys(useEditorStore.getState().segments)[0]
    const originalPoints = useEditorStore.getState().segments[segmentId].points
    const originalLength = originalPoints.length

    useEditorStore.getState().insertBendPoint(segmentId, 100, 50)

    const updated = useEditorStore.getState().segments[segmentId]
    expect(updated.points).toHaveLength(originalLength + 1)
    // First and last vertices (station anchors) are preserved
    expect(updated.points[0]).toEqual(originalPoints[0])
    expect(updated.points[updated.points.length - 1]).toEqual(
      originalPoints[originalPoints.length - 1]
    )
    // The inserted point is somewhere in the interior
    const hasInserted = updated.points.some(
      (p) => p.x === 100 && p.y === 50
    )
    expect(hasInserted).toBe(true)
  })

  it('insertBendPoint records a snapshot in pastStates for undo', () => {
    useEditorStore.getState().addStation(0, 0)
    useEditorStore.getState().addStation(200, 0)
    const stationIds = Object.keys(useEditorStore.getState().stations)
    useEditorStore.getState().addLine('Line 1', '#00ff00')
    const lineId = Object.keys(useEditorStore.getState().lines)[0]
    useEditorStore.getState().addSegment(stationIds[0], stationIds[1], lineId)

    const segmentId = Object.keys(useEditorStore.getState().segments)[0]
    const pastLengthBefore = useEditorStore.getState().pastStates.length

    useEditorStore.getState().insertBendPoint(segmentId, 100, 50)

    expect(useEditorStore.getState().pastStates.length).toBe(pastLengthBefore + 1)
  })

  it('removeBendPoint removes an interior vertex', () => {
    useEditorStore.getState().addStation(0, 0)
    useEditorStore.getState().addStation(200, 0)
    const stationIds = Object.keys(useEditorStore.getState().stations)
    useEditorStore.getState().addLine('Line 1', '#00ff00')
    const lineId = Object.keys(useEditorStore.getState().lines)[0]
    useEditorStore.getState().addSegment(stationIds[0], stationIds[1], lineId)

    const segmentId = Object.keys(useEditorStore.getState().segments)[0]
    useEditorStore.getState().insertBendPoint(segmentId, 100, 50)

    const beforeRemove = useEditorStore.getState().segments[segmentId].points
    const interiorIndex = beforeRemove.findIndex(
      (p) => p.x === 100 && p.y === 50
    )
    expect(interiorIndex).toBeGreaterThan(0)

    useEditorStore.getState().removeBendPoint(segmentId, interiorIndex)

    const after = useEditorStore.getState().segments[segmentId].points
    expect(after).toHaveLength(beforeRemove.length - 1)
    expect(after.some((p) => p.x === 100 && p.y === 50)).toBe(false)
  })

  it('removeBendPoint refuses to remove an endpoint', () => {
    useEditorStore.getState().addStation(0, 0)
    useEditorStore.getState().addStation(200, 0)
    const stationIds = Object.keys(useEditorStore.getState().stations)
    useEditorStore.getState().addLine('Line 1', '#00ff00')
    const lineId = Object.keys(useEditorStore.getState().lines)[0]
    useEditorStore.getState().addSegment(stationIds[0], stationIds[1], lineId)

    const segmentId = Object.keys(useEditorStore.getState().segments)[0]
    const before = useEditorStore.getState().segments[segmentId]

    useEditorStore.getState().removeBendPoint(segmentId, 0)
    useEditorStore.getState().removeBendPoint(
      segmentId,
      before.points.length - 1
    )

    const after = useEditorStore.getState().segments[segmentId]
    expect(after.points).toEqual(before.points)
  })

  it('undo restores previous state after adding a station', () => {
    useEditorStore.getState().addStation(100, 200)

    const state = useEditorStore.getState()
    const stationId = Object.keys(state.stations)[0]

    useEditorStore.getState().undo()

    const undoneState = useEditorStore.getState()

    expect(Object.keys(undoneState.stations)).toHaveLength(0)
    expect(undoneState.pastStates).toHaveLength(0)
    expect(undoneState.futureStates).toHaveLength(1)
    expect(undoneState.futureStates[0].stations[stationId]).toBeDefined()
  })

  it('redo restores undone state', () => {
    useEditorStore.getState().addStation(100, 200)

    const state = useEditorStore.getState()
    const stationId = Object.keys(state.stations)[0]

    useEditorStore.getState().undo()
    useEditorStore.getState().redo()

    const redoneState = useEditorStore.getState()

    expect(Object.keys(redoneState.stations)).toHaveLength(1)
    expect(redoneState.stations[stationId]).toBeDefined()
    expect(redoneState.futureStates).toHaveLength(0)
  })

  it('new action clears redo history', () => {
    useEditorStore.getState().addStation(100, 200)
    useEditorStore.getState().undo()
    useEditorStore.getState().addStation(300, 400)

    const state = useEditorStore.getState()

    expect(state.futureStates).toHaveLength(0)
    expect(state.pastStates).toHaveLength(1)
  })

  it('adds a line', () => {
    useEditorStore.getState().addLine('Red Line', '#ff0000')

    const state = useEditorStore.getState()
    const lineIds = Object.keys(state.lines)

    expect(lineIds).toHaveLength(1)
    expect(state.lines[lineIds[0]].name).toBe('Red Line')
    expect(state.lines[lineIds[0]].color).toBe('#ff0000')
  })

  it('sets a line name', () => {
    useEditorStore.getState().addLine('Blue Line', '#0000ff')

    const state = useEditorStore.getState()
    const lineId = Object.keys(state.lines)[0]

    useEditorStore.getState().setLineName(lineId, 'Blue Line Express')

    const updatedState = useEditorStore.getState()
    expect(updatedState.lines[lineId].name).toBe('Blue Line Express')
  })

  it('does nothing when setting name for non-existent line', () => {
    const initialState = useEditorStore.getState()

    useEditorStore.getState().setLineName('non-existent', 'Test')

    const updatedState = useEditorStore.getState()
    expect(updatedState).toEqual(initialState)
  })

  it('addLine stores an optional code field', () => {
    useEditorStore.getState().addLine('Metro 1', '#1976d2', 'M1')
    const state = useEditorStore.getState()
    const lineId = Object.keys(state.lines)[0]
    expect(state.lines[lineId].code).toBe('M1')
  })

  it('addLine treats an empty code as undefined', () => {
    useEditorStore.getState().addLine('No code', '#1976d2', '')
    const state = useEditorStore.getState()
    const lineId = Object.keys(state.lines)[0]
    expect(state.lines[lineId].code).toBeUndefined()
  })

  it('addLine defaults lineStyle to solid and transitMode to metro', () => {
    useEditorStore.getState().addLine('Default Line', '#1976d2')
    const state = useEditorStore.getState()
    const lineId = Object.keys(state.lines)[0]
    expect(state.lines[lineId].lineStyle).toBe('solid')
    expect(state.lines[lineId].transitMode).toBe('metro')
  })

  it('addLine stores custom lineStyle and transitMode', () => {
    useEditorStore.getState().addLine('Rail Line', '#1976d2', undefined, 'double', 'rail')
    const state = useEditorStore.getState()
    const lineId = Object.keys(state.lines)[0]
    expect(state.lines[lineId].lineStyle).toBe('double')
    expect(state.lines[lineId].transitMode).toBe('rail')
  })

  it('setLineCode trims and truncates the code', () => {
    useEditorStore.getState().addLine('Line', '#1976d2')
    const lineId = Object.keys(useEditorStore.getState().lines)[0]

    useEditorStore.getState().setLineCode(lineId, '  ABCDE  ')

    expect(useEditorStore.getState().lines[lineId].code).toBe('ABCD')
  })

  it('setLineCode clears the code when given an empty string', () => {
    useEditorStore.getState().addLine('Line', '#1976d2', 'M1')
    const lineId = Object.keys(useEditorStore.getState().lines)[0]

    useEditorStore.getState().setLineCode(lineId, '')

    expect(useEditorStore.getState().lines[lineId].code).toBeUndefined()
  })

  it('addShape creates a shape with points, color and default opacity', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ]
    useEditorStore.getState().addShape(points, '#a8d5e2', 'Lake')
    const state = useEditorStore.getState()
    const shapeId = Object.keys(state.shapes)[0]
    expect(state.shapes[shapeId].points).toEqual(points)
    expect(state.shapes[shapeId].color).toBe('#a8d5e2')
    expect(state.shapes[shapeId].name).toBe('Lake')
    expect(state.shapes[shapeId].opacity).toBe(0.5)
  })

  it('addShape treats an empty name as undefined', () => {
    useEditorStore.getState().addShape([{ x: 0, y: 0 }], '#a8d5e2', '')
    const state = useEditorStore.getState()
    const shapeId = Object.keys(state.shapes)[0]
    expect(state.shapes[shapeId].name).toBeUndefined()
  })

  it('addShape uses custom opacity', () => {
    useEditorStore.getState().addShape([{ x: 0, y: 0 }], '#a8d5e2', undefined, 0.8)
    const state = useEditorStore.getState()
    const shapeId = Object.keys(state.shapes)[0]
    expect(state.shapes[shapeId].opacity).toBe(0.8)
  })

  it('updateShape updates shape properties', () => {
    useEditorStore.getState().addShape([{ x: 0, y: 0 }], '#a8d5e2')
    const shapeId = Object.keys(useEditorStore.getState().shapes)[0]

    useEditorStore.getState().updateShape(shapeId, {
      color: '#ff0000',
      name: 'Park',
      opacity: 0.7,
    })

    const shape = useEditorStore.getState().shapes[shapeId]
    expect(shape.color).toBe('#ff0000')
    expect(shape.name).toBe('Park')
    expect(shape.opacity).toBe(0.7)
  })

  it('deleteShape removes a shape', () => {
    useEditorStore.getState().addShape([{ x: 0, y: 0 }], '#a8d5e2')
    const shapeId = Object.keys(useEditorStore.getState().shapes)[0]

    useEditorStore.getState().deleteShape(shapeId)

    expect(useEditorStore.getState().shapes[shapeId]).toBeUndefined()
  })

  it('undo restores deleted shape', () => {
    useEditorStore.getState().addShape([{ x: 0, y: 0 }], '#a8d5e2')
    const shapeId = Object.keys(useEditorStore.getState().shapes)[0]

    useEditorStore.getState().deleteShape(shapeId)
    useEditorStore.getState().undo()

    expect(useEditorStore.getState().shapes[shapeId]).toBeDefined()
  })

  it('undo restores shape update', () => {
    useEditorStore.getState().addShape([{ x: 0, y: 0 }, { x: 100, y: 100 }], '#a8d5e2')
    const shapeId = Object.keys(useEditorStore.getState().shapes)[0]
    const originalPoints = useEditorStore.getState().shapes[shapeId].points

    useEditorStore.getState().updateShape(shapeId, {
      points: [{ x: 50, y: 50 }, { x: 150, y: 150 }],
    })
    useEditorStore.getState().undo()

    expect(useEditorStore.getState().shapes[shapeId].points).toEqual(originalPoints)
  })

  it('clears all data', () => {
    useEditorStore.getState().addStation(100, 200)
    useEditorStore.getState().addStation(300, 400)
    useEditorStore.getState().addLine('Test Line', '#00ff00')

    useEditorStore.getState().clear()

    const state = useEditorStore.getState()
    expect(Object.keys(state.stations)).toHaveLength(0)
    expect(Object.keys(state.segments)).toHaveLength(0)
    expect(Object.keys(state.lines)).toHaveLength(0)
    expect(Object.keys(state.shapes)).toHaveLength(0)
    expect(state.pastStates).toHaveLength(0)
    expect(state.futureStates).toHaveLength(0)
  })

  it('initializes with default state when localStorage is cleared', () => {
    // Reset the store to simulate cleared localStorage
    useEditorStore.setState({
      activeTool: 'select',
      stations: {},
      segments: {},
      lines: {},
      shapes: {},
      lineWidth: 10,
      gridCellSize: 50,
      gridCellsWidth: 80,
      gridCellsHeight: 80,
      showLineCodes: true,
      language: 'en',
      pastStates: [],
      futureStates: [],
    })

    const state = useEditorStore.getState()
    expect(state.activeTool).toBe('select')
    expect(state.lineWidth).toBe(10)
    expect(state.gridCellSize).toBe(50)
    expect(state.gridCellsWidth).toBe(80)
    expect(state.gridCellsHeight).toBe(80)
    expect(state.showLineCodes).toBe(true)
    expect(state.language).toBe('en')
  })

  it('zooms in', () => {
    const state = useEditorStore.getState()
    const initialZoom = state.viewport.zoom

    useEditorStore.getState().zoomIn()

    const updatedState = useEditorStore.getState()
    expect(updatedState.viewport.zoom).toBe(initialZoom * 1.15)
  })

  it('zooms out', () => {
    const state = useEditorStore.getState()
    const initialZoom = state.viewport.zoom

    useEditorStore.getState().zoomOut()

    const updatedState = useEditorStore.getState()
    expect(updatedState.viewport.zoom).toBe(initialZoom / 1.15)
  })

  it('zooms in around center point', () => {
    useEditorStore.getState().setViewport({ zoom: 1, offsetX: 100, offsetY: 100 })

    useEditorStore.getState().zoomIn(200, 200)

    const state = useEditorStore.getState()
    expect(state.viewport.zoom).toBe(1.15)
    // Offsets should be adjusted to zoom around (200, 200)
    // newOffsetX = 200 - (200 - 100) * 1.15 = 200 - 115 = 85
    expect(state.viewport.offsetX).toBeCloseTo(85, 0)
    expect(state.viewport.offsetY).toBeCloseTo(85, 0)
  })

  it('zooms out around center point', () => {
    useEditorStore.getState().setViewport({ zoom: 1.15, offsetX: 85, offsetY: 85 })

    useEditorStore.getState().zoomOut(200, 200)

    const state = useEditorStore.getState()
    expect(state.viewport.zoom).toBeCloseTo(1, 0)
    // Offsets should be adjusted to zoom around (200, 200)
    // newOffsetX = 200 - (200 - 85) * (1/1.15) = 200 - 115 * 0.869565 ≈ 200 - 100 = 100
    expect(state.viewport.offsetX).toBeCloseTo(100, 0)
    expect(state.viewport.offsetY).toBeCloseTo(100, 0)
  })

  it('zooms out does not go below 0.1', () => {
    useEditorStore.getState().setViewport({ zoom: 0.1, offsetX: 0, offsetY: 0 })

    useEditorStore.getState().zoomOut()

    const state = useEditorStore.getState()
    expect(state.viewport.zoom).toBe(0.1)
  })

  it('zooms in does not go above 10', () => {
    useEditorStore.getState().setViewport({ zoom: 10, offsetX: 0, offsetY: 0 })

    useEditorStore.getState().zoomIn()

    const state = useEditorStore.getState()
    expect(state.viewport.zoom).toBe(10)
  })

  it('resets viewport to default', () => {
    useEditorStore.getState().setViewport({ zoom: 2.5, offsetX: 100, offsetY: 200 })

    useEditorStore.getState().resetViewport()

    const state = useEditorStore.getState()
    expect(state.viewport.zoom).toBe(1)
    expect(state.viewport.offsetX).toBe(0)
    expect(state.viewport.offsetY).toBe(0)
  })

  it('sets viewport', () => {
    useEditorStore.getState().setViewport({ zoom: 1.5, offsetX: 50, offsetY: 75 })

    const state = useEditorStore.getState()
    expect(state.viewport.zoom).toBe(1.5)
    expect(state.viewport.offsetX).toBe(50)
    expect(state.viewport.offsetY).toBe(75)
  })

  describe('deleteStation', () => {
    it('deletes a station', () => {
      useEditorStore.getState().addStation(100, 200)
      const state = useEditorStore.getState()
      const stationId = Object.keys(state.stations)[0]

      useEditorStore.getState().deleteStation(stationId)

      const updatedState = useEditorStore.getState()
      expect(updatedState.stations[stationId]).toBeUndefined()
    })

    it('deletes connected segments when deleting a station', () => {
      useEditorStore.getState().addStation(100, 200)
      useEditorStore.getState().addStation(300, 400)
      useEditorStore.getState().addLine('Line 1', '#ff0000')
      const state = useEditorStore.getState()
      const stationIds = Object.keys(state.stations)
      const lineId = Object.keys(state.lines)[0]

      useEditorStore.getState().addSegment(stationIds[0], stationIds[1], lineId)
      const segmentId = Object.keys(state.segments)[0]

      useEditorStore.getState().deleteStation(stationIds[0])

      const updatedState = useEditorStore.getState()
      expect(updatedState.stations[stationIds[0]]).toBeUndefined()
      expect(updatedState.segments[segmentId]).toBeUndefined()
    })

    it('does not delete other stations', () => {
      useEditorStore.getState().addStation(100, 200)
      useEditorStore.getState().addStation(300, 400)
      const state = useEditorStore.getState()
      const stationIds = Object.keys(state.stations)

      useEditorStore.getState().deleteStation(stationIds[0])

      const updatedState = useEditorStore.getState()
      expect(updatedState.stations[stationIds[1]]).toBeDefined()
    })
  })

  describe('deleteSegment', () => {
    it('deletes a segment', () => {
      useEditorStore.getState().addStation(100, 200)
      useEditorStore.getState().addStation(300, 400)
      useEditorStore.getState().addLine('Line 1', '#ff0000')
      const state = useEditorStore.getState()
      const stationIds = Object.keys(state.stations)
      const lineId = Object.keys(state.lines)[0]

      useEditorStore.getState().addSegment(stationIds[0], stationIds[1], lineId)
      const segmentId = Object.keys(state.segments)[0]

      useEditorStore.getState().deleteSegment(segmentId)

      const updatedState = useEditorStore.getState()
      expect(updatedState.segments[segmentId]).toBeUndefined()
    })

    it('does not delete stations when deleting a segment', () => {
      useEditorStore.getState().addStation(100, 200)
      useEditorStore.getState().addStation(300, 400)
      useEditorStore.getState().addLine('Line 1', '#ff0000')
      const state = useEditorStore.getState()
      const stationIds = Object.keys(state.stations)
      const lineId = Object.keys(state.lines)[0]

      useEditorStore.getState().addSegment(stationIds[0], stationIds[1], lineId)
      const segmentId = Object.keys(state.segments)[0]

      useEditorStore.getState().deleteSegment(segmentId)

      const updatedState = useEditorStore.getState()
      expect(updatedState.stations[stationIds[0]]).toBeDefined()
      expect(updatedState.stations[stationIds[1]]).toBeDefined()
    })
  })

  describe('segment splitting', () => {
    beforeEach(() => {
      useEditorStore.getState().clear()
    })

    it('splits segment when station is added on top of it', () => {
      useEditorStore.getState().addStation(100, 100)
      useEditorStore.getState().addStation(300, 300)
      useEditorStore.getState().addLine('Line 1', '#ff0000')
      const state = useEditorStore.getState()
      const stationIds = Object.keys(state.stations)
      const lineId = Object.keys(state.lines)[0]

      useEditorStore.getState().addSegment(stationIds[0], stationIds[1], lineId)
      const segmentId = Object.keys(state.segments)[0]

      // Add a station on top of the segment (midpoint)
      useEditorStore.getState().addStation(200, 200)

      const updatedState = useEditorStore.getState()
      // Old segment should be removed
      expect(updatedState.segments[segmentId]).toBeUndefined()
      // Two new segments should be created
      const newSegmentIds = Object.keys(updatedState.segments)
      expect(newSegmentIds.length).toBe(2)
      // New station should exist
      const newStationIds = Object.keys(updatedState.stations)
      expect(newStationIds.length).toBe(3)
    })

    it('does not split segment when station is added far from it', () => {
      useEditorStore.getState().addStation(100, 100)
      useEditorStore.getState().addStation(300, 300)
      useEditorStore.getState().addLine('Line 1', '#ff0000')
      const state = useEditorStore.getState()
      const stationIds = Object.keys(state.stations)
      const lineId = Object.keys(state.lines)[0]

      useEditorStore.getState().addSegment(stationIds[0], stationIds[1], lineId)
      const segmentsAfterAdd = Object.keys(useEditorStore.getState().segments)
      
      // Verify segment was created
      expect(segmentsAfterAdd.length).toBe(1)
      const segmentId = segmentsAfterAdd[0]

      // Add a station far from the segment
      useEditorStore.getState().addStation(1000, 1000)

      const updatedState = useEditorStore.getState()
      // Original segment should still exist
      expect(updatedState.segments[segmentId]).toBeDefined()
      // Only one segment should exist (no splitting occurred)
      expect(Object.keys(updatedState.segments).length).toBe(1)
    })
  })

  describe('Multi-line segments', () => {
    it('creates segment with single lineId in array', () => {
      useEditorStore.getState().addStation(100, 200)
      useEditorStore.getState().addStation(300, 400)
      useEditorStore.getState().addLine('Line 1', '#ff0000')

      const state = useEditorStore.getState()
      const stationIds = Object.keys(state.stations)
      const lineId = Object.keys(state.lines)[0]

      useEditorStore.getState().addSegment(stationIds[0], stationIds[1], lineId)

      const updatedState = useEditorStore.getState()
      const segmentIds = Object.keys(updatedState.segments)
      const segment = updatedState.segments[segmentIds[0]]

      expect(segment.lineIds).toEqual([lineId])
    })

    it('segment lineIds array can contain multiple line IDs', () => {
      // Create a segment with multiple lineIds manually
      const segmentId = 'test-segment'
      const lineIds = ['line1', 'line2', 'line3']
      
      useEditorStore.getState().addStation(100, 200)
      useEditorStore.getState().addStation(300, 400)
      useEditorStore.getState().addLine('Line 1', '#ff0000')
      useEditorStore.getState().addLine('Line 2', '#00ff00')
      useEditorStore.getState().addLine('Line 3', '#0000ff')

      const state = useEditorStore.getState()
      const stationIds = Object.keys(state.stations)

      // Manually add a segment with multiple lineIds
      useEditorStore.setState({
        ...state,
        segments: {
          ...state.segments,
          [segmentId]: {
            id: segmentId,
            fromStationId: stationIds[0],
            toStationId: stationIds[1],
            lineIds,
            points: [
              { x: 100, y: 200 },
              { x: 300, y: 400 },
            ],
          },
        },
      })

      const updatedState = useEditorStore.getState()
      const segment = updatedState.segments[segmentId]

      expect(segment.lineIds).toEqual(lineIds)
      expect(segment.lineIds).toHaveLength(3)
    })

    it('splits segment with multiple lineIds into multiple segments', () => {
      useEditorStore.getState().addStation(100, 200)
      useEditorStore.getState().addStation(300, 400)
      useEditorStore.getState().addLine('Line 1', '#ff0000')
      useEditorStore.getState().addLine('Line 2', '#00ff00')

      const state = useEditorStore.getState()
      const stationIds = Object.keys(state.stations)
      const lineIds = Object.keys(state.lines)

      // Create a segment with multiple lineIds
      const segmentId = 'test-segment'
      useEditorStore.setState({
        ...state,
        segments: {
          ...state.segments,
          [segmentId]: {
            id: segmentId,
            fromStationId: stationIds[0],
            toStationId: stationIds[1],
            lineIds,
            points: [
              { x: 100, y: 200 },
              { x: 300, y: 400 },
            ],
          },
        },
      })

      // Add a station on the segment (should split for each line)
      useEditorStore.getState().addStation(200, 300)

      const updatedState = useEditorStore.getState()
      // Original segment should be removed
      expect(updatedState.segments[segmentId]).toBeUndefined()
      // Should have 2 new segments per line = 4 segments total
      expect(Object.keys(updatedState.segments).length).toBe(4)
    })
  })

  it('defaults showLineCodes to true', () => {
    const state = useEditorStore.getState()
    expect(state.showLineCodes).toBe(true)
  })

  it('toggles showLineCodes', () => {
    useEditorStore.getState().setShowLineCodes(false)
    expect(useEditorStore.getState().showLineCodes).toBe(false)

    useEditorStore.getState().setShowLineCodes(true)
    expect(useEditorStore.getState().showLineCodes).toBe(true)
  })

  it('sets station services', () => {
    useEditorStore.getState().addStation(100, 200)
    const stationId = Object.keys(useEditorStore.getState().stations)[0]

    useEditorStore.getState().setStationServices(stationId, ['accessibility', 'rail'])
    const updated = useEditorStore.getState().stations[stationId]
    expect(updated.services).toEqual(['accessibility', 'rail'])

    useEditorStore.getState().setStationServices(stationId, ['ferry'])
    expect(useEditorStore.getState().stations[stationId].services).toEqual(['ferry'])

    useEditorStore.getState().setStationServices(stationId, ['airport', 'toilet'])
    expect(useEditorStore.getState().stations[stationId].services).toEqual(['airport', 'toilet'])

    useEditorStore.getState().setStationServices(stationId, [])
    expect(useEditorStore.getState().stations[stationId].services).toBeUndefined()
  })

  it('does nothing when setting services for non-existent station', () => {
    const initialState = useEditorStore.getState()
    useEditorStore.getState().setStationServices('non-existent', ['accessibility'])
    expect(useEditorStore.getState()).toEqual(initialState)
  })

  it('sets and clears station fare zone', () => {
    useEditorStore.getState().addStation(100, 200)
    const stationId = Object.keys(useEditorStore.getState().stations)[0]

    useEditorStore.getState().setStationFareZone(stationId, 2)
    expect(useEditorStore.getState().stations[stationId].fareZone).toBe(2)

    useEditorStore.getState().setStationFareZone(stationId, 5)
    expect(useEditorStore.getState().stations[stationId].fareZone).toBe(5)

    useEditorStore.getState().setStationFareZone(stationId, undefined)
    expect(useEditorStore.getState().stations[stationId].fareZone).toBeUndefined()
  })

  it('does nothing when setting fare zone for non-existent station', () => {
    const initialState = useEditorStore.getState()
    useEditorStore.getState().setStationFareZone('non-existent', 3)
    expect(useEditorStore.getState()).toEqual(initialState)
  })

  it('defaults language to en', () => {
    expect(useEditorStore.getState().language).toBe('en')
  })

  it('sets language to de', () => {
    useEditorStore.getState().setLanguage('de')
    expect(useEditorStore.getState().language).toBe('de')
  })

  it('sets language back to en', () => {
    useEditorStore.getState().setLanguage('de')
    useEditorStore.getState().setLanguage('en')
    expect(useEditorStore.getState().language).toBe('en')
  })
})
