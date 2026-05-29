import { beforeEach, describe, expect, it } from 'vitest'
import { benchmarkStore } from './benchmarkStore'
import { generateSyntheticMap } from './generator'
import baselines from './baselines.json'

const ITERATIONS = {
    pan: 1000,
    zoom: 1000,
    undo: 100,
    addStation: 100,
    addSegment: 100,
}

const WARMUP = 20

/**
 * Measures total time for a batch of `iterations`.
 * Returns total milliseconds (not per-op) to avoid noise from GC pauses
 * being amplified when divided by a small iteration count.
 */
function measureBatch(label: string, fn: () => void, iterations: number): number {
    for (let i = 0; i < WARMUP; i++) fn()

    const start = performance.now()
    for (let i = 0; i < iterations; i++) fn()
    const total = performance.now() - start

    const perOp = total / iterations
    console.log(`  ${label}: ${total.toFixed(2)} ms total (${perOp.toFixed(4)} ms/op over ${iterations} it)`)
    return total
}

describe('performance benchmarks', () => {
    beforeEach(() => {
        // Reset store to clean state
        benchmarkStore.setState({
            activeTool: 'select',
            stations: {},
            segments: {},
            lines: {},
            shapes: {},
            pastStates: [],
            futureStates: [],
            viewport: { zoom: 1, offsetX: 0, offsetY: 0 },
        })
    })

    it(`pan: baseline ${baselines.metrics.pan} ms/op (${baselines.metrics.pan * ITERATIONS.pan} ms total)`, () => {
        const { stations, segments, lines } = generateSyntheticMap(500, 50)
        benchmarkStore.setState({ stations, segments, lines })

        const setViewport = benchmarkStore.getState().setViewport
        let offset = 0

        const total = measureBatch('pan', () => {
            offset += 1
            setViewport({ zoom: 1, offsetX: offset, offsetY: offset })
        }, ITERATIONS.pan)

        expect(total).toBeLessThanOrEqual(
            baselines.metrics.pan * ITERATIONS.pan * (1 + baselines.thresholdPercent / 100)
        )
    })

    it(`zoom: baseline ${baselines.metrics.zoom} ms/op (${baselines.metrics.zoom * ITERATIONS.zoom} ms total)`, () => {
        const { stations, segments, lines } = generateSyntheticMap(500, 50)
        benchmarkStore.setState({ stations, segments, lines })

        const zoomIn = benchmarkStore.getState().zoomIn
        const zoomOut = benchmarkStore.getState().zoomOut
        let toggle = false

        const total = measureBatch('zoom', () => {
            toggle = !toggle
            if (toggle) zoomIn()
            else zoomOut()
        }, ITERATIONS.zoom)

        expect(total).toBeLessThanOrEqual(
            baselines.metrics.zoom * ITERATIONS.zoom * (1 + baselines.thresholdPercent / 100)
        )
    })

    it(`undo: baseline ${baselines.metrics.undo} ms/op (${baselines.metrics.undo * ITERATIONS.undo} ms total)`, () => {
        const store = benchmarkStore.getState()
        // Seed history by adding stations one at a time
        for (let i = 0; i < 500; i++) {
            store.addStation(i * 10, i * 10, `St ${i}`)
        }

        const total = measureBatch('undo', () => {
            benchmarkStore.getState().undo()
        }, ITERATIONS.undo)

        expect(total).toBeLessThanOrEqual(
            baselines.metrics.undo * ITERATIONS.undo * (1 + baselines.thresholdPercent / 100)
        )
    })

    it(`addStation: baseline ${baselines.metrics.addStation} ms/op (${baselines.metrics.addStation * ITERATIONS.addStation} ms total)`, () => {
        const { stations, segments, lines } = generateSyntheticMap(500, 50)
        benchmarkStore.setState({ stations, segments, lines })

        const addStation = benchmarkStore.getState().addStation
        let i = 0

        const total = measureBatch('addStation', () => {
            i++
            addStation(i * 150, i * 150, `New ${i}`)
        }, ITERATIONS.addStation)

        expect(total).toBeLessThanOrEqual(
            baselines.metrics.addStation * ITERATIONS.addStation * (1 + baselines.thresholdPercent / 100)
        )
    })

    it(`addSegment: baseline ${baselines.metrics.addSegment} ms/op (${baselines.metrics.addSegment * ITERATIONS.addSegment} ms total)`, () => {
        const { stations } = generateSyntheticMap(500, 50)
        // Add a single line for segment creation
        const addLine = benchmarkStore.getState().addLine
        addLine('Benchmark Line', '#000000', 'B')
        const lineId = Object.keys(benchmarkStore.getState().lines)[0]

        // Load stations into store
        benchmarkStore.setState((state) => ({
            ...state,
            stations: { ...state.stations, ...stations },
        }))

        const stationIds = Object.keys(benchmarkStore.getState().stations)
        const addSegment = benchmarkStore.getState().addSegment
        let i = 0

        const total = measureBatch('addSegment', () => {
            const fromIdx = i % stationIds.length
            const toIdx = (i + 1) % stationIds.length
            addSegment(stationIds[fromIdx], stationIds[toIdx], lineId)
            i++
        }, ITERATIONS.addSegment)

        expect(total).toBeLessThanOrEqual(
            baselines.metrics.addSegment * ITERATIONS.addSegment * (1 + baselines.thresholdPercent / 100)
        )
    })
})
