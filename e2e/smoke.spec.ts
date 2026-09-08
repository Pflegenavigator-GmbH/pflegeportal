// e2e/smoke.spec.ts
import { expect, test } from '@playwright/test';

/**
 * Smoke-Test der gebauten Anwendung.
 *
 * Bewusst schlank gehalten (siehe Issue #77): Vitest deckt Einheiten und
 * Komponenten bereits ab. Hier stehen nur Zusicherungen, die sich AUSSCHLIESSLICH
 * am Produktions-Build prüfen lassen — startet der Server, greift das
 * Sprach-Routing, stimmen die Sicherheits-Header, werden statische Dateien
 * ausgeliefert.
 *
 * Zwei der Fälle sind Regressionsschutz für Fehler, die es real gab und die
 * beide erst in Produktion aufgefallen wären.
 */

test.describe('Anwendung startet', () => {
  // Sprache fest vorgeben: next-intl handelt die Locale über den
  // Accept-Language-Header aus. Ohne diese Zeile hängt das Ergebnis an der
  // Voreinstellung des Playwright-Geräteprofils (en-US) — der Test wäre dann
  // nicht deterministisch und würde je nach Profil auf /en oder /de landen.
  test.use({ locale: 'de-DE' });

  test('leitet die Wurzel auf die Standardsprache und rendert den Inhalt', async ({ page }) => {
    // Nicht abgefangene Ausnahmen sammeln — ein weißer Bildschirm entsteht
    // fast immer so. Bewusst nur `pageerror` (echte Exceptions), nicht jede
    // Konsolenwarnung: Sonst wird der Test durch Fremdrauschen unzuverlässig.
    const ausnahmen: string[] = [];
    page.on('pageerror', (fehler) => ausnahmen.push(fehler.message));

    const antwort = await page.goto('/');

    expect(antwort?.status(), 'Startseite muss mit 200 antworten').toBe(200);
    await expect(page).toHaveURL(/\/de(\/)?$/);
    await expect(page.locator('#main-content')).toBeVisible();
    expect(ausnahmen, 'keine unbehandelten JavaScript-Fehler').toEqual([]);
  });

  test('erreicht den Pflegegrad-Einstieg', async ({ page }) => {
    const antwort = await page.goto('/de/pflegegrad/start');

    expect(antwort?.status()).toBe(200);
    await expect(page.locator('#main-content')).toBeVisible();
  });
});

test.describe('Sicherheits-Header', () => {
  test('liefert eine CSP ohne unsafe-eval', async ({ page }) => {
    // Regressionsschutz: `unsafe-eval` ist nur im Dev-Server gesetzt. Ein
    // Fehler in dieser Weiche fällt in keinem Unit-Test auf und würde die
    // Schutzwirkung der CSP in Produktion stillschweigend aufheben.
    const antwort = await page.goto('/de');
    const header = antwort?.headers() ?? {};
    const csp = header['content-security-policy'];

    expect(csp, 'CSP-Header muss gesetzt sein').toBeTruthy();
    expect(csp).not.toContain("'unsafe-eval'");
    // Für WebAssembly (Draco-Decoder des Avatars) weiterhin nötig:
    expect(csp).toContain("'wasm-unsafe-eval'");

    expect(header['x-frame-options']).toBe('DENY');
    expect(header['x-content-type-options']).toBe('nosniff');
    expect(header['strict-transport-security']).toBeTruthy();
  });
});

test.describe('Statische Dateien', () => {
  test('werden nicht ins Sprach-Routing gezogen', async ({ request }) => {
    // Regressionsschutz: Der Middleware-Matcher hat statische Dateien schon
    // einmal auf /de/... umgeleitet (307 statt 200). Betroffen waren das
    // Avatar-Modell und die Presse-Downloads — beides nur in der laufenden
    // Anwendung sichtbar, nicht im Build.
    for (const pfad of ['/models/navi_avatar.glb', '/robots.txt', '/sitemap.xml']) {
      const antwort = await request.get(pfad, { maxRedirects: 0 });
      expect(antwort.status(), `${pfad} darf nicht umgeleitet werden`).toBe(200);
    }
  });
});
