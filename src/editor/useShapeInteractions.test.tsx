import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useEditorStore } from '../store/editorStore'
import { useShapeInteractions } from './useShapeInteractions'

describe('useShapeInteractions', () => {
    beforeEach(() => {
        useEditorStore.getState().clear()
    })

    it('creates a shape from three points and resets the draft', () => {
        const { result } = renderHook(() => useShapeInteractions())

        act(() => {
            result.current.appendShapePoint({ x: 0, y: 0 })
            result.current.appendShapePoint({ x: 20, y: 0 })
            result.current.appendShapePoint({ x: 0, y: 20 })
        })
        act(() => result.current.finishShapeDrawing())

        const shapes = Object.values(useEditorStore.getState().shapes)
        expect(shapes).toHaveLength(1)
        expect(shapes[0].points).toHaveLength(3)
        expect(result.current.shapePoints).toEqual([])
    })

    it('does not create a shape from fewer than three points', () => {
        const { result } = renderHook(() => useShapeInteractions())

        act(() => {
            result.current.appendShapePoint({ x: 0, y: 0 })
            result.current.appendShapePoint({ x: 20, y: 0 })
        })
        act(() => result.current.finishShapeDrawing())

        expect(useEditorStore.getState().shapes).toEqual({})
        expect(result.current.shapePoints).toHaveLength(2)
    })

    it('undoes and cancels draft points', () => {
        const { result } = renderHook(() => useShapeInteractions())

        act(() => {
            result.current.appendShapePoint({ x: 0, y: 0 })
            result.current.appendShapePoint({ x: 20, y: 0 })
        })
        act(() => result.current.undoShapePoint())
        expect(result.current.shapePoints).toEqual([{ x: 0, y: 0 }])

        act(() => result.current.cancelShapeDrawing())
        expect(result.current.shapePoints).toEqual([])
    })

    it('updates a dragged vertex and ends the drag', () => {
        useEditorStore.getState().addShape(
            [{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 0, y: 20 }],
            '#00ff00',
        )
        const shapeId = Object.keys(useEditorStore.getState().shapes)[0]
        const { result } = renderHook(() => useShapeInteractions())

        act(() => result.current.beginShapeVertexDrag(shapeId, 1))
        act(() => {
            result.current.updateDraggedShapeVertex({ x: 30, y: 10 })
        })

        expect(useEditorStore.getState().shapes[shapeId].points[1]).toEqual({ x: 30, y: 10 })
        let ended = false
        act(() => {
            ended = result.current.endShapeVertexDrag()
        })
        expect(ended).toBe(true)
        expect(result.current.draggingShapeVertex).toBeNull()
    })
})
