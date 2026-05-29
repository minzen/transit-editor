import { create } from 'zustand'
import type { DataSlice } from '../store/slices/dataSlice'
import type { ToolSlice } from '../store/slices/toolSlice'
import type { ViewSlice } from '../store/slices/viewSlice'
import { createDataSlice } from '../store/slices/dataSlice'
import { createToolSlice } from '../store/slices/toolSlice'
import { createViewSlice } from '../store/slices/viewSlice'

export type BenchmarkState = DataSlice & ToolSlice & ViewSlice

export const benchmarkStore = create<BenchmarkState>()((...a) => ({
    ...createDataSlice(...a),
    ...createToolSlice(...a),
    ...createViewSlice(...a),
}))
