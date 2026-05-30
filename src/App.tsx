import './App.css'
import { useEffect, useMemo } from 'react'
import { EditorCanvas } from './editor/EditorCanvas'
import { LandingPage } from './LandingPage'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEditorStore } from './store/editorStore'
import i18n from './i18n/i18n'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

function App() {
    const language = useEditorStore((s) => s.language)
    const themeMode = useEditorStore((s) => s.themeMode)
    const announcement = useEditorStore((s) => s.announcement)
    const clearAnnouncement = useEditorStore((s) => s.clearAnnouncement)

    const muiTheme = useMemo(() => createTheme({
        palette: {
            mode: themeMode,
        },
    }), [themeMode])

    useEffect(() => {
        if (language && language !== i18n.language) {
            void i18n.changeLanguage(language)
        }
    }, [language])

    useEffect(() => {
        if (announcement) {
            const timer = setTimeout(() => clearAnnouncement(), 1000)
            return () => clearTimeout(timer)
        }
    }, [announcement, clearAnnouncement])

    return (
        <ThemeProvider theme={muiTheme}>
            <CssBaseline />
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/editor" element={<EditorCanvas />} />
                </Routes>
            </BrowserRouter>
            <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                style={{
                    position: 'absolute',
                    left: '-10000px',
                    width: '1px',
                    height: '1px',
                    overflow: 'hidden',
                }}
            >
                {announcement}
            </div>
        </ThemeProvider>
    )
}

export default App
