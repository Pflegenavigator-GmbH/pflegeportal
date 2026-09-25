// src/proxy.test.ts
// @vitest-environment node
//
// Node statt jsdom: `next-intl/middleware` löst `next/server` in der
// Browser-Umgebung nicht auf.
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { verifyPreviewToken } from '@/src/lib/preview/preview-auth';

import proxy from './proxy';

// next-intl bringt sein eigenes Middleware-Bündel mit, das `next/server` in
// der Testumgebung nicht auflöst. Das Sprach-Routing ist hier ohnehin nicht
// Gegenstand — geprüft wird allein, wer an der Sperre vorbeikommt.
vi.mock('next-intl/middleware', () => ({
  default: () => () => new Response(null, { status: 200 }),
}));

// Die API-Pipeline (Rate-Limit, Cache) ist hier nicht Gegenstand; sie würde
// nur Redis verlangen.
vi.mock('@/src/lib/redis/middleware-api', () => ({
  handleApiRequest: vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 })),
}));

// Die kryptografische Prüfung bekommt eigene Unit-Tests.
// Hier interessiert nur, wie der Proxy mit gültigen bzw. ungültigen
// Preview-Tokens umgeht.
vi.mock('@/src/lib/preview/preview-auth', () => ({
  PREVIEW_COOKIE_NAME: 'preview-access',
  verifyPreviewToken: vi.fn(),
}));

const mockedVerifyPreviewToken = vi.mocked(verifyPreviewToken);

const anfrage = (pfad: string, token?: string) => {
  const request = new NextRequest(
      `http://localhost:3000${pfad}`
  );

  if (token) {
    request.cookies.set('preview-access', token);
  }

  return request;
};

/** Leitet die Antwort auf die Anmeldeseite um? */
const istUmleitungZurAnmeldung = (antwort: Response) =>
    antwort.status >= 300 &&
    antwort.status < 400 &&
    (antwort.headers.get('location') ?? '').includes(
        'preview-login'
    );

describe('Vorschau-Sperre in der Middleware', () => {
  beforeEach(() => {
    vi.stubEnv('PREVIEW_PROTECTION_ENABLED', 'true');
    vi.stubEnv(
        'PREVIEW_TOKEN_SECRET',
        'test-preview-token-secret'
    );

    mockedVerifyPreviewToken.mockReset();
    mockedVerifyPreviewToken.mockResolvedValue(false);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('ist aus, solange die Variable nicht ausdrücklich "true" ist', async () => {
    // Nicht gesetzt heißt aus — und jeder andere Wert ebenfalls. Sonst würde
    // ein Tippfehler die öffentliche Seite sperren.
    for (const wert of [
      undefined,
      '',
      'false',
      'True',
      '1',
      'ja',
    ]) {
      if (wert === undefined) {
        vi.stubEnv('PREVIEW_PROTECTION_ENABLED', '');
      } else {
        vi.stubEnv(
            'PREVIEW_PROTECTION_ENABLED',
            wert
        );
      }

      const antwort = await proxy(
          anfrage('/de/pflegegrad/start')
      );

      expect(
          istUmleitungZurAnmeldung(antwort),
          `Wert: ${String(wert)}`
      ).toBe(false);
    }
  });

  it('sperrt bei aktiver Vorschau jede Seite ohne Cookie', async () => {
    const antwort = await proxy(
        anfrage('/de/pflegegrad/start')
    );

    expect(
        istUmleitungZurAnmeldung(antwort)
    ).toBe(true);

    expect(
        mockedVerifyPreviewToken
    ).not.toHaveBeenCalled();
  });

  it('lässt mit gültigem signiertem Token durch', async () => {
    mockedVerifyPreviewToken.mockResolvedValue(true);

    const antwort = await proxy(
        anfrage(
            '/de/pflegegrad/start',
            'gueltiger-signierter-token'
        )
    );

    expect(
        istUmleitungZurAnmeldung(antwort)
    ).toBe(false);

    expect(
        mockedVerifyPreviewToken
    ).toHaveBeenCalledWith(
        'gueltiger-signierter-token',
        'test-preview-token-secret'
    );
  });

  it('sperrt bei ungültigem oder manipuliertem Token', async () => {
    mockedVerifyPreviewToken.mockResolvedValue(false);

    const antwort = await proxy(
        anfrage(
            '/de/pflegegrad/start',
            'manipulierter-token'
        )
    );

    expect(
        istUmleitungZurAnmeldung(antwort)
    ).toBe(true);

    expect(
        mockedVerifyPreviewToken
    ).toHaveBeenCalledWith(
        'manipulierter-token',
        'test-preview-token-secret'
    );
  });

  it('lässt die Anmeldeseite in jeder Sprache durch', async () => {
    for (const pfad of [
      '/preview-login',
      '/de/preview-login',
      '/en/preview-login',
    ]) {
      expect(
          istUmleitungZurAnmeldung(
              await proxy(anfrage(pfad))
          ),
          pfad
      ).toBe(false);
    }
  });

  /**
   * Die Sperre blockierte bis zum 19.09.2026 ihre eigene Anmelderoute: Der
   * POST wurde umgeleitet, die Seite bekam HTML statt JSON — und die
   * Freischaltung schlug fehl, egal welches Passwort eingegeben wurde.
   */
  it('lässt die Anmelderoute durch — sonst ist keine Freischaltung möglich', async () => {
    expect(
        istUmleitungZurAnmeldung(
            await proxy(anfrage('/api/preview-login'))
        )
    ).toBe(false);
  });

  /**
   * Stripe schickt kein Cookie. Eine Weiterleitung quittiert Stripe als
   * erfolgreiche Zustellung — die Zahlung bliebe unverbucht, und es fiele
   * erst bei der Abrechnung auf.
   */
  it('lässt den Stripe-Webhook durch', async () => {
    expect(
        istUmleitungZurAnmeldung(
            await proxy(anfrage('/api/stripe/webhook'))
        )
    ).toBe(false);
  });

  it('sperrt andere API-Routen weiterhin', async () => {
    expect(
        istUmleitungZurAnmeldung(
            await proxy(anfrage('/api/case/status'))
        )
    ).toBe(true);
  });

  it('schlägt geschlossen fehl, wenn bei aktivem Schutz das Token-Secret fehlt', async () => {
    vi.stubEnv('PREVIEW_TOKEN_SECRET', '');

    const antwort = await proxy(
        anfrage('/de/pflegegrad/start')
    );

    expect(antwort.status).toBe(500);

    expect(
        istUmleitungZurAnmeldung(antwort)
    ).toBe(false);

    expect(
        mockedVerifyPreviewToken
    ).not.toHaveBeenCalled();
  });
});