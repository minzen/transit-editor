import { Button, Box, Slider, Typography, Stack, Popover } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '../store/editorStore'
import {
    getBackgroundImageDimensionError,
    getBackgroundImageFileError,
} from './backgroundImageValidation'

export function BackgroundImageControl() {
    const { t } = useTranslation()
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
    const [imageError, setImageError] = useState<string | null>(null)
    const backgroundImageUrl = useEditorStore((s) => s.backgroundImageUrl)
    const showBackgroundImage = useEditorStore((s) => s.showBackgroundImage)
    const backgroundImageX = useEditorStore((s) => s.backgroundImageX)
    const backgroundImageY = useEditorStore((s) => s.backgroundImageY)
    const backgroundImageWidth = useEditorStore((s) => s.backgroundImageWidth)
    const backgroundImageHeight = useEditorStore((s) => s.backgroundImageHeight)
    const backgroundImageOpacity = useEditorStore((s) => s.backgroundImageOpacity)
    const setBackgroundImageUrl = useEditorStore((s) => s.setBackgroundImageUrl)
    const setShowBackgroundImage = useEditorStore((s) => s.setShowBackgroundImage)
    const setBackgroundImageX = useEditorStore((s) => s.setBackgroundImageX)
    const setBackgroundImageY = useEditorStore((s) => s.setBackgroundImageY)
    const setBackgroundImageWidth = useEditorStore((s) => s.setBackgroundImageWidth)
    const setBackgroundImageHeight = useEditorStore((s) => s.setBackgroundImageHeight)
    const setBackgroundImageOpacity = useEditorStore((s) => s.setBackgroundImageOpacity)

    const handleLoadImage = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/png,image/jpeg,image/webp'
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
                const fileError = getBackgroundImageFileError(file)
                if (fileError) {
                    setImageError(fileError)
                    return
                }

                const objectUrl = URL.createObjectURL(file)
                const image = new Image()
                image.onload = () => {
                    URL.revokeObjectURL(objectUrl)
                    const dimensionError = getBackgroundImageDimensionError(
                        image.naturalWidth,
                        image.naturalHeight,
                    )
                    if (dimensionError) {
                        setImageError(dimensionError)
                        return
                    }

                    const reader = new FileReader()
                    reader.onload = (event) => {
                        if (typeof event.target?.result !== 'string') {
                            setImageError('Failed to read background image')
                            return
                        }
                        setBackgroundImageUrl(event.target.result)
                        setImageError(null)
                    }
                    reader.onerror = () => setImageError('Failed to read background image')
                    reader.readAsDataURL(file)
                }
                image.onerror = () => {
                    URL.revokeObjectURL(objectUrl)
                    setImageError('Background image could not be decoded')
                }
                image.src = objectUrl
            }
        }
        input.click()
    }

    const handleRemove = () => {
        setBackgroundImageUrl(null)
        setAnchorEl(null)
    }

    const open = Boolean(anchorEl)

    return (
        <>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button size="small" onClick={handleLoadImage}>
                    {t('backgroundImageControl.loadImage')}
                </Button>
                {backgroundImageUrl && (
                    <Button
                        size="small"
                        variant={open ? 'contained' : 'outlined'}
                        onClick={(e) => setAnchorEl(open ? null : e.currentTarget)}
                    >
                        {t('backgroundImageControl.adjustImage')}
                    </Button>
                )}
            </Box>
            {imageError && (
                <Typography role="alert" color="error" variant="caption">
                    {imageError}
                </Typography>
            )}

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
                <Stack direction="column" spacing={1} sx={{ p: 2, minWidth: 240 }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setShowBackgroundImage(!showBackgroundImage)}
                        >
                            {showBackgroundImage ? t('backgroundImageControl.hideBG') : t('backgroundImageControl.showBG')}
                        </Button>
                        <Button size="small" color="error" variant="outlined" onClick={handleRemove}>
                            {t('backgroundImageControl.removeImage')}
                        </Button>
                    </Box>
                    <Typography variant="caption">{t('backgroundImageControl.placement')}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ minWidth: 16 }}>{t('backgroundImageControl.x')}</Typography>
                        <Slider
                            size="small"
                            value={backgroundImageX}
                            min={-5000}
                            max={5000}
                            step={10}
                            onChange={(_, v) => setBackgroundImageX(v)}
                            sx={{ flex: 1 }}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ minWidth: 16 }}>{t('backgroundImageControl.y')}</Typography>
                        <Slider
                            size="small"
                            value={backgroundImageY}
                            min={-5000}
                            max={5000}
                            step={10}
                            onChange={(_, v) => setBackgroundImageY(v)}
                            sx={{ flex: 1 }}
                        />
                    </Box>
                    <Typography variant="caption">{t('backgroundImageControl.width')}</Typography>
                    <Slider
                        size="small"
                        value={backgroundImageWidth}
                        min={100}
                        max={10000}
                        step={50}
                        onChange={(_, v) => setBackgroundImageWidth(v)}
                    />
                    <Typography variant="caption">{t('backgroundImageControl.height')}</Typography>
                    <Slider
                        size="small"
                        value={backgroundImageHeight}
                        min={100}
                        max={10000}
                        step={50}
                        onChange={(_, v) => setBackgroundImageHeight(v)}
                    />
                    <Typography variant="caption">{t('backgroundImageControl.opacity')}</Typography>
                    <Slider
                        size="small"
                        value={backgroundImageOpacity}
                        min={0}
                        max={1}
                        step={0.05}
                        onChange={(_, v) => setBackgroundImageOpacity(v)}
                    />
                </Stack>
            </Popover>
        </>
    )
}
