import { useMediaQuery, useTheme } from '@mui/material'

/**
 * Returns true when the viewport is at or below the theme's `sm` breakpoint,
 * i.e. phone-sized screens.
 */
export function useIsMobile(): boolean {
    const theme = useTheme()
    return useMediaQuery(theme.breakpoints.down('sm'))
}

/**
 * Returns true when the viewport is at or below the theme's `md` breakpoint,
 * i.e. tablet-sized screens and smaller.
 */
export function useIsTablet(): boolean {
    const theme = useTheme()
    return useMediaQuery(theme.breakpoints.down('md'))
}
