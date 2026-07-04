import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}{ext}',
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : 2,
    reporter: [['html', { open: 'never' }], ['list']],
    timeout: 60_000,
    use: {
        baseURL: 'http://localhost:5173',
        trace: 'on-first-retry',
        navigationTimeout: 45_000,
        actionTimeout: 15_000,
    },
    projects: [
        // Primary desktop browser for CI
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1280, height: 800 },
                deviceScaleFactor: 1,
            },
        },
        // Secondary browsers (can be run locally or in extended CI)
        ...(process.env.CI ? [] : [
            {
                name: 'firefox',
                use: {
                    ...devices['Desktop Firefox'],
                    viewport: { width: 1280, height: 800 },
                },
            },
            {
                name: 'webkit',
                use: {
                    ...devices['Desktop Safari'],
                    viewport: { width: 1280, height: 800 },
                },
            },
        ]),
        // Mobile/Tablet - use Chrome for faster execution in CI
        {
            name: 'mobile-chrome',
            use: {
                ...devices['Pixel 7'],
            },
        },
        ...(process.env.CI ? [] : [
            {
                name: 'mobile-safari',
                use: {
                    ...devices['iPhone 14'],
                },
            },
            {
                name: 'tablet-chrome',
                use: {
                    ...devices['Desktop Chrome'],
                    viewport: { width: 1280, height: 800 },
                    deviceScaleFactor: 1,
                },
            },
            {
                name: 'tablet-safari',
                use: {
                    ...devices['iPad (gen 7)'],
                },
            },
        ]),
    ],
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
            VITE_PLAUSIBLE_DOMAIN: process.env.VITE_PLAUSIBLE_DOMAIN ?? '',
            VITE_PLAUSIBLE_URL: process.env.VITE_PLAUSIBLE_URL ?? '',
        },
    },
    expect: {
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.03,
        },
    },
})
