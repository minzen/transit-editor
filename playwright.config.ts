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
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1280, height: 800 },
                deviceScaleFactor: 1,
            },
        },
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
        // Mobile devices
        {
            name: 'mobile-chrome',
            use: {
                ...devices['Pixel 7'],
            },
        },
        {
            name: 'mobile-safari',
            use: {
                ...devices['iPhone 14'],
            },
        },
        {
            name: 'tablet-chrome',
            use: {
                ...devices['Pixel Tablet'],
            },
        },
        {
            name: 'tablet-safari',
            use: {
                ...devices['iPad (gen 7)'],
            },
        },
    ],
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
    expect: {
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.03,
        },
    },
})
