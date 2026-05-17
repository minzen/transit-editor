import './App.css'
import { EditorCanvas } from './editor/EditorCanvas'
import { LandingPage } from './LandingPage'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
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
