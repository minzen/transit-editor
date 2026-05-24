import { describe, it, expect } from 'vitest'
import { validateLineName, validateStationName, VALIDATION } from './constants'

describe('validation constants', () => {
    describe('validateLineName', () => {
        it('accepts valid line names', () => {
            expect(validateLineName('Line 1').valid).toBe(true)
            expect(validateLineName('A').valid).toBe(true)
            expect(validateLineName('Express Bus').valid).toBe(true)
        })

        it('rejects empty line names', () => {
            expect(validateLineName('').valid).toBe(false)
            expect(validateLineName('   ').valid).toBe(false)
            expect(validateLineName('').error).toBe('Line name cannot be empty')
        })

        it('rejects line names exceeding max length', () => {
            const longName = 'A'.repeat(VALIDATION.MAX_LINE_NAME_LENGTH + 1)
            const result = validateLineName(longName)
            expect(result.valid).toBe(false)
            expect(result.error).toBe(`Line name cannot exceed ${VALIDATION.MAX_LINE_NAME_LENGTH} characters`)
        })

        it('accepts line names at max length', () => {
            const maxName = 'A'.repeat(VALIDATION.MAX_LINE_NAME_LENGTH)
            expect(validateLineName(maxName).valid).toBe(true)
        })

        it('sanitizes HTML tags', () => {
            const result = validateLineName('<script>alert("xss")</script>Line 1')
            expect(result.valid).toBe(true)
            expect(result.sanitized).toBe('alert(xss)Line 1')
        })

        it('sanitizes javascript: URLs', () => {
            const result = validateLineName('javascript:alert("xss")')
            expect(result.valid).toBe(true)
            expect(result.sanitized).toBe('alert(xss)')
        })

        it('sanitizes event handlers', () => {
            const result = validateLineName('Line 1 onclick=alert("xss")')
            expect(result.valid).toBe(true)
            expect(result.sanitized).toBe('Line 1 alert(xss)')
        })

        it('keeps allowed characters', () => {
            const result = validateLineName('Line-1 (Station A).')
            expect(result.valid).toBe(true)
            expect(result.sanitized).toBe('Line-1 (Station A).')
        })

        it('removes special characters', () => {
            const result = validateLineName('Line@#$%^&*()')
            expect(result.valid).toBe(true)
            expect(result.sanitized).toBe('Line()')
        })
    })

    describe('validateStationName', () => {
        it('accepts valid station names', () => {
            expect(validateStationName('Central Station').valid).toBe(true)
            expect(validateStationName('A').valid).toBe(true)
            expect(validateStationName('').valid).toBe(true) // Optional
        })

        it('rejects station names exceeding max length', () => {
            const longName = 'A'.repeat(VALIDATION.MAX_STATION_NAME_LENGTH + 1)
            const result = validateStationName(longName)
            expect(result.valid).toBe(false)
            expect(result.error).toBe(`Station name cannot exceed ${VALIDATION.MAX_STATION_NAME_LENGTH} characters`)
        })

        it('accepts station names at max length', () => {
            const maxName = 'A'.repeat(VALIDATION.MAX_STATION_NAME_LENGTH)
            expect(validateStationName(maxName).valid).toBe(true)
        })

        it('accepts empty station names (optional)', () => {
            expect(validateStationName('').valid).toBe(true)
            expect(validateStationName('   ').valid).toBe(true)
        })

        it('sanitizes HTML tags', () => {
            const result = validateStationName('<script>alert("xss")</script>Central')
            expect(result.valid).toBe(true)
            expect(result.sanitized).toBe('alert(xss)Central')
        })

        it('sanitizes javascript: URLs', () => {
            const result = validateStationName('javascript:alert("xss")')
            expect(result.valid).toBe(true)
            expect(result.sanitized).toBe('alert(xss)')
        })

        it('keeps allowed characters', () => {
            const result = validateStationName('Central-Station (A).')
            expect(result.valid).toBe(true)
            expect(result.sanitized).toBe('Central-Station (A).')
        })

        it('removes special characters', () => {
            const result = validateStationName('Station@#$%^&*()')
            expect(result.valid).toBe(true)
            expect(result.sanitized).toBe('Station()')
        })
    })
})
