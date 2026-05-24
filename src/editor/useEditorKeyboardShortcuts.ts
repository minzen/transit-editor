import { useEffect, useState } from 'react'

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
    const [spacePressed, setSpacePressed] = useState(false)

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setSpacePressed(true)
            }
            if ((e.code === 'Delete' || e.code === 'Backspace') && (selectedStationIds.length > 0 || selectedShapeId) && !spacePressed) {
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
                setSpacePressed(false)
            }
        }

        window.addEventListener('keydown', down, { passive: false })
        window.addEventListener('keyup', up, { passive: false })

        return () => {
            window.removeEventListener('keydown', down)
            window.removeEventListener('keyup', up)
        }
    }, [selectedStationIds, selectedShapeId, spacePressed, onDeleteSelected, onUndo, onRedo, canUndo, canRedo])

    return { spacePressed }
}
