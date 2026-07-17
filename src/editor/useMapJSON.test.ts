import { describe, expect, it } from 'vitest'
import { getMapImportFileSizeError, MAX_MAP_IMPORT_FILE_BYTES } from './useMapJSON'

describe('getMapImportFileSizeError', () => {
    it('accepts files at or below the import size limit', () => {
        expect(getMapImportFileSizeError(MAX_MAP_IMPORT_FILE_BYTES)).toBeNull()
    })

    it('rejects files exceeding the import size limit', () => {
        expect(getMapImportFileSizeError(MAX_MAP_IMPORT_FILE_BYTES + 1)).toBe('Map file exceeds the 5 MB import limit')
    })
})
