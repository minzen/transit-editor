import { useEffect, useRef, useState } from 'react'

type Options = {
    selectedStationIds: string[]
    selectedShapeId: string | null
    onDeleteSelected: () => void
    onUndo: () => void
    onRedo: () => void
    canUndo: boolean
    canRedo: boolean
}

/**
 * Subscribes to global keyboard shortcuts used in the editor canvas:
 * - Space (held): activates panning mode (returned via `spacePressed`).
 * - Delete / Backspace: triggers deletion of the currently selected stations
 *   or shape, unless Space is also held.
 * - Ctrl+Z / Cmd+Z: undo last action.
 * - Ctrl+Y / Cmd+Shift+Z: redo last action.
 *
 * Uses a ref for the internal Space tracking to avoid a stale closure race:
 * if Space and Delete are pressed in rapid succession, React may not have
 * re-rendered the effect before the second keydown arrives.
 */
export function useEditorKeyboardShortcuts({
    selectedStationIds,
    selectedShapeId,
    onDeleteSelected,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
}: Options) {
    // Ref tracks the authoritative value for event handlers (no stale closure)
    const spacePressedRef = useRef(false)
    // State is kept in sync so consumers can observe it reactively
    const [spacePressed, setSpacePressed] = useState(false)

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                spacePressedRef.current = true
                setSpacePressed(true)
            }
            if ((e.code === 'Delete' || e.code === 'Backspace') && (selectedStationIds.length > 0 || selectedShapeId) && !spacePressedRef.current) {
                e.preventDefault()
                onDeleteSelected()
            }
            // Undo: Ctrl+Z or Cmd+Z
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey && canUndo) {
                e.preventDefault()
                onUndo()
            }
            // Redo: Ctrl+Y or Cmd+Shift+Z
            if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyY' || (e.code === 'KeyZ' && e.shiftKey)) && canRedo) {
                e.preventDefault()
                onRedo()
            }
        }

        const up = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                spacePressedRef.current = false
                setSpacePressed(false)
            }
        }

        window.addEventListener('keydown', down, { passive: false })
        window.addEventListener('keyup', up, { passive: false })

        return () => {
            window.removeEventListener('keydown', down)
            window.removeEventListener('keyup', up)
        }
    }, [selectedStationIds, selectedShapeId, onDeleteSelected, onUndo, onRedo, canUndo, canRedo])

    return { spacePressed }
}
