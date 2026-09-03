import { useCallback, useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import type { Point } from '../types/geometry'

type DraggingShapeVertex = {
    shapeId: string
    pointIndex: number
}

export function useShapeInteractions() {
    const shapes = useEditorStore((state) => state.shapes)
    const addShape = useEditorStore((state) => state.addShape)
    const updateShape = useEditorStore((state) => state.updateShape)

    const [shapePoints, setShapePoints] = useState<Point[]>([])
    const [shapeColor, setShapeColor] = useState('#a8d5e2')
    const [draggingShapeVertex, setDraggingShapeVertex] = useState<DraggingShapeVertex | null>(null)

    const appendShapePoint = useCallback((point: Point) => {
        setShapePoints((current) => [...current, point])
    }, [])

    const cancelShapeDrawing = useCallback(() => {
        setShapePoints([])
    }, [])

    const undoShapePoint = useCallback(() => {
        setShapePoints((current) => current.slice(0, -1))
    }, [])

    const finishShapeDrawing = useCallback(() => {
        if (shapePoints.length < 3) return
        addShape(shapePoints, shapeColor)
        setShapePoints([])
    }, [addShape, shapeColor, shapePoints])

    const beginShapeVertexDrag = useCallback((shapeId: string, pointIndex: number) => {
        setDraggingShapeVertex({ shapeId, pointIndex })
    }, [])

    const updateDraggedShapeVertex = useCallback((point: Point) => {
        if (!draggingShapeVertex) return false
        const shape = shapes[draggingShapeVertex.shapeId]
        if (!shape) return true

        const points = [...shape.points]
        points[draggingShapeVertex.pointIndex] = point
        updateShape(draggingShapeVertex.shapeId, { points })
        return true
    }, [draggingShapeVertex, shapes, updateShape])

    const endShapeVertexDrag = useCallback(() => {
        if (!draggingShapeVertex) return false
        setDraggingShapeVertex(null)
        return true
    }, [draggingShapeVertex])

    return {
        shapePoints,
        setShapePoints,
        shapeColor,
        setShapeColor,
        draggingShapeVertex,
        appendShapePoint,
        cancelShapeDrawing,
        undoShapePoint,
        finishShapeDrawing,
        beginShapeVertexDrag,
        updateDraggedShapeVertex,
        endShapeVertexDrag,
    }
}
