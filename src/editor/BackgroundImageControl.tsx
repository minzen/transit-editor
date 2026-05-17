type Props = {
    backgroundImage: string | null
    showBackground: boolean
    setShowBackground: (show: boolean) => void
    setBackgroundImage: (image: string | null) => void
}

export function BackgroundImageControl({
    backgroundImage,
    showBackground,
    setShowBackground,
    setBackgroundImage,
}: Props) {
    const handleLoadImage = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
                const reader = new FileReader()
                reader.onload = (event) => {
                    setBackgroundImage(event.target?.result as string)
                }
                reader.readAsDataURL(file)
            }
        }
        input.click()
    }

    return (
        <>
            <button
                type="button"
                className="editor-toolbar-button"
                onClick={handleLoadImage}
                title="Load background image"
            >
                Load Image
            </button>

            {backgroundImage && (
                <button
                    type="button"
                    className="editor-toolbar-button"
                    onClick={() => setShowBackground(!showBackground)}
                    title={showBackground ? 'Hide background' : 'Show background'}
                >
                    {showBackground ? 'Hide BG' : 'Show BG'}
                </button>
            )}
        </>
    )
}
