import { useEffect, useState } from 'react'

type Options = {
    selectedStationIds: string[]
    selectedShapeId: string | null
    onDeleteSelected: () => void
}

/**
 * Subscribes to global keyboard shortcuts used in the editor canvas:
 * - Space (held): activates panning mode (returned via `spacePressed`).
 * - Delete / Backspace: triggers deletion of the currently selected stations
 *   or shape, unless Space is also held.
 */
export function useEditorKeyboardShortcuts({
    selectedStationIds,
    selectedShapeId,
    onDeleteSelected,
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
        }

        const up = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setSpacePressed(false)
            }
        }

        window.addEventListener('keydown', down)
        window.addEventListener('keyup', up)

        return () => {
            window.removeEventListener('keydown', down)
            window.removeEventListener('keyup', up)
        }
    }, [selectedStationIds, selectedShapeId, spacePressed, onDeleteSelected])

    return { spacePressed }
}
