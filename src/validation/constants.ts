// Validation constants for input limits

export const VALIDATION = {
    MAX_LINE_NAME_LENGTH: 50,
    MAX_STATION_NAME_LENGTH: 50,
    MIN_LINE_NAME_LENGTH: 1,
    MIN_STATION_NAME_LENGTH: 0, // Station name is optional
} as const

// Sanitize input to prevent XSS and injection attacks
function sanitizeInput(input: string): string {
    // Remove HTML tags and their content
    let sanitized = input.replace(/<[^>]*>/g, '')
    
    // Remove common XSS patterns
    sanitized = sanitized.replace(/javascript:/gi, '')
    sanitized = sanitized.replace(/on\w+\s*=/gi, '')
    
    // Remove HTML entity encodings
    sanitized = sanitized.replace(/&lt;/gi, '')
    sanitized = sanitized.replace(/&gt;/gi, '')
    sanitized = sanitized.replace(/&amp;/gi, '')
    sanitized = sanitized.replace(/&#/gi, '')
    
    // Remove potentially dangerous characters for this use case
    // Keep letters, numbers, spaces, and common punctuation: hyphen, underscore, dot, parentheses
    sanitized = sanitized.replace(/[^\p{L}\p{N}\s\-_.()]/gu, '')
    
    return sanitized.trim()
}

export function validateLineName(name: string): { valid: boolean; error?: string; sanitized?: string } {
    const sanitized = sanitizeInput(name)
    
    if (sanitized.length < VALIDATION.MIN_LINE_NAME_LENGTH) {
        return { valid: false, error: 'Line name cannot be empty', sanitized }
    }
    
    if (sanitized.length > VALIDATION.MAX_LINE_NAME_LENGTH) {
        return { valid: false, error: `Line name cannot exceed ${VALIDATION.MAX_LINE_NAME_LENGTH} characters`, sanitized }
    }
    
    return { valid: true, sanitized }
}

export function validateStationName(name: string): { valid: boolean; error?: string; sanitized?: string } {
    const sanitized = sanitizeInput(name)
    
    if (sanitized.length > VALIDATION.MAX_STATION_NAME_LENGTH) {
        return { valid: false, error: `Station name cannot exceed ${VALIDATION.MAX_STATION_NAME_LENGTH} characters`, sanitized }
    }
    
    return { valid: true, sanitized }
}
