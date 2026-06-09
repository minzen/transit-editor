import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.clear()
        })
    })

    test('landing page has title heading and subtitle', async ({ page }) => {
        await page.goto('/')
        await expect(page.getByRole('heading', { name: 'Transit Map Editor' })).toBeVisible()
        await expect(page.getByText('Create beautiful, schematic transit maps directly in your browser')).toBeVisible()
    })

    test('landing page has GitHub link', async ({ page }) => {
        await page.goto('/')
        const githubLink = page.getByRole('link', { name: 'GitHub Repository' })
        await expect(githubLink).toBeVisible()
        await expect(githubLink).toHaveAttribute('href', /github\.com/)
    })

    test('landing page has Report Issues link', async ({ page }) => {
        await page.goto('/')
        const issuesLink = page.getByRole('link', { name: 'Report Issues' })
        await expect(issuesLink).toBeVisible()
    })

    test('Start Creating button navigates to /editor', async ({ page }) => {
        await page.goto('/')
        await page.getByRole('button', { name: 'Start Creating' }).click()
        await expect(page).toHaveURL(/\/editor/)
        await expect(page.getByTestId('editor-canvas')).toBeVisible()
    })

    test('Back to Home button from editor returns to landing page', async ({ page }) => {
        await page.goto('/editor')
        await page.getByRole('button', { name: 'Back to Home' }).click()
        await expect(page).toHaveURL(/\/$|\/(?!editor)/)
        await expect(page.getByRole('heading', { name: 'Transit Map Editor' })).toBeVisible()
    })

    test('navigating directly to /editor shows the canvas', async ({ page }) => {
        await page.goto('/editor')
        await expect(page.getByTestId('editor-canvas')).toBeVisible()
    })

    test('landing page shows early dev warning alert', async ({ page }) => {
        await page.goto('/')
        await expect(page.getByText('Early development version')).toBeVisible()
    })

    test('editor page title contains all four tool buttons', async ({ page }) => {
        await page.goto('/editor')
        await expect(page.getByRole('button', { name: 'Select', exact: true })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Station', exact: true })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Segment', exact: true })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Shape', exact: true })).toBeVisible()
    })
})
