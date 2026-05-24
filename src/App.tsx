import './App.css'
import { useEffect } from 'react'
import { EditorCanvas } from './editor/EditorCanvas'
import { LandingPage } from './LandingPage'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEditorStore } from './store/editorStore'
import i18n from './i18n/i18n'

function App() {
    const language = useEditorStore((s) => s.language)

    useEffect(() => {
        if (language && language !== i18n.language) {
            void i18n.changeLanguage(language)
        }
    }, [language])

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/editor" element={<EditorCanvas />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
