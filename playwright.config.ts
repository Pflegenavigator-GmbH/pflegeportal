// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

/**
 * Siehe https://playwright.dev/docs/test-configuration für Details.
 */
export default defineConfig({
    // Ordner, in dem Playwright nach E2E-Tests sucht
    testDir: './e2e',

    // Maximale Zeit, die ein einzelner Test laufen darf (30 Sekunden)
    timeout: 30 * 1000,

    expect: {
        timeout: 5000
    },

    // Tests parallel ausführen, um Zeit zu sparen
    fullyParallel: true,

    // Fehlschläge auf der CI (Continuous Integration) isolieren, lokal im Watch-Modus erlauben
    forbidOnly: !!process.env.CI,

    // Automatische Wiederholung bei Fehlschlägen (gut gegen "flaky" Network-Sachen auf der CI)
    retries: process.env.CI ? 2 : 0,

    // Wie viele Worker parallel laufen sollen
    workers: process.env.CI ? 1 : undefined,

    // Schickes HTML-Reporting bei Fehlern
    reporter: 'html',

    use: {
        baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',

        trace: 'on-first-retry',
        video: 'retain-on-failure',
    },

    /* Die Browser, auf denen getestet wird */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
        /* Optional: Mobile Geräte testen */
        // {
        //   name: 'Mobile Chrome',
        //   use: { ...devices['Pixel 5'] },
        // },
        // {
        //   name: 'Mobile Safari',
        //   use: { ...devices['iPhone 12'] },
        // },
    ],

    /* * Best Practice für Next.js: Fährt den Server automatisch hoch,
     * falls du vergisst, 'npm run dev' im Hintergrund laufen zu lassen.
     */
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000, // 2 Minuten Zeit zum Booten des Next.js Servers
    },
});