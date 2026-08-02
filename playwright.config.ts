// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

/**
 * Siehe https://playwright.dev/docs/test-configuration für Details.
 *
 * Aufgabenteilung mit Vitest: Vitest deckt Einheiten und Komponenten ab.
 * Playwright beantwortet nur die Frage, die Vitest nicht beantworten kann —
 * startet und navigiert die GEBAUTE Anwendung in einem echten Browser?
 * Deshalb bewusst wenige, breite Tests statt vieler feiner (siehe e2e/).
 */
const istCI = !!process.env.CI;

// Eine Quelle für beide Seiten: Ohne das läuft `baseURL` gegen einen anderen
// Port als der von Playwright gestartete Server, sobald 3000 belegt ist.
const basisUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

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
    forbidOnly: istCI,

    // Automatische Wiederholung bei Fehlschlägen (gut gegen "flaky" Network-Sachen auf der CI)
    retries: istCI ? 2 : 0,

    // Wie viele Worker parallel laufen sollen
    workers: istCI ? 1 : undefined,

    // Auf der CI zusätzlich eine Zeilenausgabe, damit im Log ohne Artefakt-Download
    // sichtbar ist, was fehlschlug. `open: 'never'` verhindert, dass der
    // HTML-Report am Ende einen Webserver startet und der Job hängen bleibt.
    reporter: istCI ? [['list'], ['html', { open: 'never' }]] : [['html']],

    use: {
        baseURL: basisUrl,

        trace: 'on-first-retry',
        video: 'retain-on-failure',
    },

    /*
     * Die Browser, auf denen getestet wird.
     *
     * Auf der CI nur Chromium: Der Smoke-Test prüft, ob die Anwendung startet
     * und navigiert — das ist nicht browserabhängig. Drei Engines würden die
     * Laufzeit verdreifachen und zusätzlich Firefox- und WebKit-Binaries
     * herunterladen, ohne mehr auszusagen. Lokal bleiben alle drei verfügbar,
     * falls doch einmal ein Rendering-Unterschied verdächtigt wird.
     */
    projects: istCI
        ? [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
        : [
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
        ],

    /*
     * Startet den Server selbst.
     *
     * Auf der CI der PRODUKTIONS-Build (`npm start`), nicht `npm run dev`:
     * Geprüft werden soll das Artefakt, das auch deployt wird. Der Dev-Server
     * verhält sich anders (React Refresh, gelockerte CSP, andere Fehlerseiten)
     * und würde genau die Fehlerklasse verdecken, die nur in Produktion
     * auftritt — siehe die CSP-Falle beim 3D-Avatar. Voraussetzung: `npm run
     * build` lief vorher.
     */
    webServer: {
        command: istCI ? 'npm start' : 'npm run dev',
        url: basisUrl,
        reuseExistingServer: !istCI,
        timeout: 120 * 1000, // 2 Minuten Zeit zum Booten des Next.js Servers
    },
});
