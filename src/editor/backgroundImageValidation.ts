export const MAX_BACKGROUND_IMAGE_FILE_BYTES = 10 * 1024 * 1024
export const MAX_BACKGROUND_IMAGE_DIMENSION = 10_000
export const MAX_BACKGROUND_IMAGE_PIXELS = 40_000_000

const SUPPORTED_BACKGROUND_IMAGE_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
])

export function getBackgroundImageFileError(file: Pick<File, 'size' | 'type'>): string | null {
    if (!SUPPORTED_BACKGROUND_IMAGE_TYPES.has(file.type)) {
        return 'Background images must be PNG, JPEG, or WebP files'
    }
    if (file.size > MAX_BACKGROUND_IMAGE_FILE_BYTES) {
        return 'Background image exceeds the 10 MB limit'
    }
    return null
}

export function getBackgroundImageDimensionError(width: number, height: number): string | null {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        return 'Background image has invalid dimensions'
    }
    if (
        width > MAX_BACKGROUND_IMAGE_DIMENSION
        || height > MAX_BACKGROUND_IMAGE_DIMENSION
        || width * height > MAX_BACKGROUND_IMAGE_PIXELS
    ) {
        return 'Background image dimensions exceed the 40 megapixel limit'
    }
    return null
}
