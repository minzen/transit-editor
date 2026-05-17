type Props = {
    gridSize: number
    setGridSize: (size: number) => void
}

export function GridSizeControl({ gridSize, setGridSize }: Props) {
    return (
        <div className="editor-grid-size-control">
            <label htmlFor="gridSize">Grid:</label>
            <input
                id="gridSize"
                type="number"
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                min="10"
                max="100"
                step="10"
                className="editor-grid-size-input"
            />
        </div>
    )
}
