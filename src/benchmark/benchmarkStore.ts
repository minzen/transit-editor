import { create } from 'zustand'
import type { DataSlice } from '../store/slices/dataSlice'
import type { ToolSlice } from '../store/slices/toolSlice'
import type { ViewSlice } from '../store/slices/viewSlice'
import type { AccessibilitySlice } from '../store/slices/accessibilitySlice'
import { createDataSlice } from '../store/slices/dataSlice'
import { createToolSlice } from '../store/slices/toolSlice'
import { createViewSlice } from '../store/slices/viewSlice'
import { createAccessibilitySlice } from '../store/slices/accessibilitySlice'

export type BenchmarkState = DataSlice & ToolSlice & ViewSlice & AccessibilitySlice

export const benchmarkStore = create<BenchmarkState>()((...a) => ({
    ...createDataSlice(...a),
    ...createToolSlice(...a),
    ...createViewSlice(...a),
    ...createAccessibilitySlice(...a),
}))
