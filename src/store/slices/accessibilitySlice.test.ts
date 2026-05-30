import { describe, expect, it } from 'vitest'
import { useEditorStore } from '../editorStore'

describe('AccessibilitySlice', () => {
    it('has default empty announcement', () => {
        const state = useEditorStore.getState()
        expect(state.announcement).toBe('')
    })

    it('sets and clears announcement', () => {
        useEditorStore.getState().setAnnouncement('Station added')
        expect(useEditorStore.getState().announcement).toBe('Station added')

        useEditorStore.getState().clearAnnouncement()
        expect(useEditorStore.getState().announcement).toBe('')
    })

    it('announces on addStation', () => {
        useEditorStore.getState().clearAnnouncement()
        useEditorStore.getState().addStation(100, 200)
        expect(useEditorStore.getState().announcement).toBe('Station added')
    })

    it('announces on deleteStation', () => {
        useEditorStore.getState().addStation(100, 200)
        const id = Object.keys(useEditorStore.getState().stations)[0]
        useEditorStore.getState().clearAnnouncement()
        useEditorStore.getState().deleteStation(id)
        expect(useEditorStore.getState().announcement).toBe('Station deleted')
    })

    it('announces on undo', () => {
        useEditorStore.getState().addStation(100, 200)
        useEditorStore.getState().clearAnnouncement()
        useEditorStore.getState().undo()
        expect(useEditorStore.getState().announcement).toBe('Undo')
    })

    it('announces on redo', () => {
        useEditorStore.getState().addStation(100, 200)
        useEditorStore.getState().undo()
        useEditorStore.getState().clearAnnouncement()
        useEditorStore.getState().redo()
        expect(useEditorStore.getState().announcement).toBe('Redo')
    })

    it('announces on addLine', () => {
        useEditorStore.getState().clearAnnouncement()
        useEditorStore.getState().addLine('Red', '#ff0000')
        expect(useEditorStore.getState().announcement).toBe('Line created')
    })

    it('announces on clear', () => {
        useEditorStore.getState().addStation(100, 200)
        useEditorStore.getState().clearAnnouncement()
        useEditorStore.getState().clear()
        expect(useEditorStore.getState().announcement).toBe('All data cleared')
    })
})
