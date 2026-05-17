import { Button } from '@mui/material'

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
            <Button size="small" onClick={handleLoadImage}>
                Load Image
            </Button>

            {backgroundImage && (
                <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setShowBackground(!showBackground)}
                >
                    {showBackground ? 'Hide BG' : 'Show BG'}
                </Button>
            )}
        </>
    )
}
