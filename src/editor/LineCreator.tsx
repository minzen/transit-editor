type Props = {
    newLineName: string
    setNewLineName: (name: string) => void
    newLineColor: string
    setNewLineColor: (color: string) => void
    addLine: (name: string, color: string) => void
    setIsCreatingLine: (creating: boolean) => void
    colorPalette: string[]
}

export function LineCreator({
    newLineName,
    setNewLineName,
    newLineColor,
    setNewLineColor,
    addLine,
    setIsCreatingLine,
    colorPalette,
}: Props) {
    return (
        <div className="editor-line-creator">
            <input
                type="text"
                value={newLineName}
                onChange={(e) => setNewLineName(e.target.value)}
                placeholder="Line name"
                className="editor-line-name-input"
            />
            <div className="editor-color-palette">
                {colorPalette.map((color) => (
                    <button
                        key={color}
                        type="button"
                        className={`editor-color-swatch ${
                            newLineColor === color ? 'active' : ''
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewLineColor(color)}
                        title={color}
                    />
                ))}
            </div>
            <button
                type="button"
                className="editor-toolbar-button"
                onClick={() => {
                    if (newLineName.trim()) {
                        addLine(newLineName.trim(), newLineColor)
                        setNewLineName('')
                        setNewLineColor('#1976d2')
                        setIsCreatingLine(false)
                    }
                }}
            >
                Create
            </button>
            <button
                type="button"
                className="editor-toolbar-button"
                onClick={() => {
                    setNewLineName('')
                    setNewLineColor('#1976d2')
                    setIsCreatingLine(false)
                }}
            >
                Cancel
            </button>
        </div>
    )
}
