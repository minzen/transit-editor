import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../store/editorStore'

const PAN_STEP = 80
const PAN_STEP_FAST = 320

type Options = {
    selectedStationIds: string[]
    selectedShapeIds: string[]
    onDeleteSelected: () => void
    onSelectAll: () => void
    onUndo: () => void
    onRedo: () => void
    canUndo: boolean
    canRedo: boolean
    svgRef: React.RefObject<SVGSVGElement | null>
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
    selectedShapeIds,
    onDeleteSelected,
    onSelectAll,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    svgRef,
}: Options) {
    // Ref tracks the authoritative value for event handlers (no stale closure)
    const spacePressedRef = useRef(false)
    // State is kept in sync so consumers can observe it reactively
    const [spacePressed, setSpacePressed] = useState(false)

    useEffect(() => {
        const isInputFocused = () => {
            const active = document.activeElement
            if (!active) return false
            const tag = active.tagName
            return (
                tag === 'INPUT' ||
                tag === 'TEXTAREA' ||
                active.getAttribute('contenteditable') === 'true'
            )
        }

        const isSvgFocused = () => svgRef.current != null && document.activeElement === svgRef.current

        const pan = (dx: number, dy: number) => {
            const { viewport, setViewport } = useEditorStore.getState()
            setViewport({
                zoom: viewport.zoom,
                offsetX: viewport.offsetX + dx,
                offsetY: viewport.offsetY + dy,
            })
        }

        const down = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                spacePressedRef.current = true
                setSpacePressed(true)
            }

            if (!isInputFocused() && (e.ctrlKey || e.metaKey) && e.code === 'KeyA') {
                e.preventDefault()
                onSelectAll()
                return
            }

            if (!isInputFocused() && !e.ctrlKey && !e.metaKey) {
                const step = e.shiftKey ? PAN_STEP_FAST : PAN_STEP
                const isWasd =
                    e.code === 'KeyW' || e.code === 'KeyA' ||
                    e.code === 'KeyS' || e.code === 'KeyD'
                const isArrow =
                    e.code === 'ArrowUp' || e.code === 'ArrowDown' ||
                    e.code === 'ArrowLeft' || e.code === 'ArrowRight'

                if (isWasd || (isArrow && !isSvgFocused())) {
                    e.preventDefault()
                    if (e.code === 'KeyW' || e.code === 'ArrowUp')    pan(0, step)
                    if (e.code === 'KeyS' || e.code === 'ArrowDown')  pan(0, -step)
                    if (e.code === 'KeyA' || e.code === 'ArrowLeft')  pan(step, 0)
                    if (e.code === 'KeyD' || e.code === 'ArrowRight') pan(-step, 0)
                    return
                }
            }
            if (
                (e.code === 'Delete' || e.code === 'Backspace') &&
                !isInputFocused() &&
                (selectedStationIds.length > 0 || selectedShapeIds.length > 0) &&
                !spacePressedRef.current
            ) {
                e.preventDefault()
                onDeleteSelected()
            }
            // Undo: Ctrl+Z or Cmd+Z
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey && canUndo && !isInputFocused()) {
                e.preventDefault()
                onUndo()
            }
            // Redo: Ctrl+Y or Cmd+Shift+Z
            if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyY' || (e.code === 'KeyZ' && e.shiftKey)) && canRedo && !isInputFocused()) {
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
    }, [selectedStationIds, selectedShapeIds, onDeleteSelected, onSelectAll, onUndo, onRedo, canUndo, canRedo, svgRef])

    return { spacePressed }
}
