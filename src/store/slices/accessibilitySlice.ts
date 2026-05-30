import type { StateCreator } from 'zustand'

export type AccessibilitySlice = {
    announcement: string
    setAnnouncement: (text: string) => void
    clearAnnouncement: () => void
}

export const createAccessibilitySlice: StateCreator<AccessibilitySlice, [], [], AccessibilitySlice> = (set) => ({
    announcement: '',
    setAnnouncement: (text) => set({ announcement: text }),
    clearAnnouncement: () => set({ announcement: '' }),
})
