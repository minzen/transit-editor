import { beforeEach, describe, expect, it } from 'vitest'
import { useEditorStore } from './editorStore'

describe('editor store', () => {
  beforeEach(() => {
    useEditorStore.setState({
      activeTool: 'select',
      stations: {},
      segments: {},
      lines: {},
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
    expect(segment.color).toBe('#00ff00')
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
})
