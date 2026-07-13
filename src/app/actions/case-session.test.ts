// src/app/actions/case-session.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { validateAndStoreSession, clearCaseSession } from '@/src/app/actions/case-session';

// ============================================================================
// 🧪 MOCK-SETUP
// ============================================================================

// 1. Spies über vi.hoisted definieren, damit die vi.mock-Factories darauf zugreifen können
const { supabaseEqMock, supabaseSingleMock, cookieSetMock, cookieDeleteMock } = vi.hoisted(() => ({
  supabaseEqMock: vi.fn(),
  supabaseSingleMock: vi.fn(),
  cookieSetMock: vi.fn(),
  cookieDeleteMock: vi.fn(),
}));

// 2. Next.js Cookies mocken — WICHTIG: die neue Action nutzt set UND delete
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    set: cookieSetMock,
    delete: cookieDeleteMock,
  }),
}));

// 3. Supabase-Client mocken (Fluent API: from → select → eq → single)
vi.mock('@/src/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: supabaseEqMock,
      }),
    }),
  }),
}));

// 4. Logger stummschalten, damit die Test-Ausgabe sauber bleibt
vi.mock('@/src/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

// ============================================================================
// 🔧 TEST-HELFER
// ============================================================================

interface DbCase {
  case_code: string;
  billing_status: string;
  access_activated_at: string | null;
  product_tier: string;
}

/** Simuliert das Ergebnis der DB-Abfrage für den nächsten Aufruf */
function mockDbResult(data: DbCase | null, error: Error | null = null) {
  supabaseEqMock.mockReturnValue({ single: supabaseSingleMock });
  supabaseSingleMock.mockResolvedValue({ data, error });
}

/** Baut einen Standard-Fall mit überschreibbaren Feldern */
function buildCase(overrides: Partial<DbCase> = {}): DbCase {
  return {
    case_code: 'PF-TEST-0001',
    billing_status: 'paid',
    access_activated_at: '2026-01-01T12:00:00.000Z',
    product_tier: 'standard',
    ...overrides,
  };
}

const CASE_COOKIE = 'pf_case_code';

// ============================================================================
// ✅ TESTS: validateAndStoreSession
// ============================================================================

describe('validateAndStoreSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Feste "Gegenwart" für alle Tests — heute im Sinne des Projekts
    vi.setSystemTime(new Date('2026-07-12T12:00:00.000Z'));
  });

  // Nach den Zeit-Tests setzen wir die Systemzeit wieder zurück
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  // --------------------------------------------------------------------------
  // Eingabe-Normalisierung
  // --------------------------------------------------------------------------

  it('normalisiert den Fallcode (trim + Großschreibung) vor der DB-Abfrage', async () => {
    mockDbResult(buildCase({ case_code: 'PF-ABCD-1234' }));

    await validateAndStoreSession('  pf-abcd-1234  ');

    expect(supabaseEqMock).toHaveBeenCalledWith('case_code', 'PF-ABCD-1234');
  });

  // --------------------------------------------------------------------------
  // Fall nicht gefunden / DB-Fehler
  // --------------------------------------------------------------------------

  it('schlägt fehl, wenn der Fall in der DB nicht existiert', async () => {
    mockDbResult(null, new Error('Not found'));

    const result = await validateAndStoreSession('NOTFOUND');

    expect(result).toEqual({
      success: false,
      isUnlocked: false,
      isExpired: false,
      billingStatus: 'not_found',
      caseCode: null,
    });
  });

  it('räumt bei unbekanntem Fallcode ein evtl. verwaistes Cookie ab', async () => {
    mockDbResult(null, new Error('Not found'));

    await validateAndStoreSession('NOTFOUND');

    expect(cookieDeleteMock).toHaveBeenCalledWith(CASE_COOKIE);
    expect(cookieSetMock).not.toHaveBeenCalled();
  });

  it('behandelt data=null ohne error-Objekt ebenfalls als "nicht gefunden"', async () => {
    mockDbResult(null, null);

    const result = await validateAndStoreSession('GHOST');

    expect(result.success).toBe(false);
    expect(result.billingStatus).toBe('not_found');
  });

  // --------------------------------------------------------------------------
  // Bezahlte / kostenlose Fälle → volle Freischaltung
  // --------------------------------------------------------------------------

  it('schaltet einen bezahlten Fall frei und setzt das Session-Cookie korrekt', async () => {
    mockDbResult(buildCase({ case_code: 'CASE123', billing_status: 'paid' }));

    const result = await validateAndStoreSession('case123');

    expect(result).toEqual({
      success: true,
      isUnlocked: true,
      isExpired: false,
      billingStatus: 'paid',
      caseCode: 'CASE123',
    });

    expect(cookieSetMock).toHaveBeenCalledExactlyOnceWith(
      CASE_COOKIE,
      'CASE123',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      })
    );
    expect(cookieDeleteMock).not.toHaveBeenCalled();
  });

  it('behandelt billing_status "free" wie "paid" (isUnlocked=true)', async () => {
    mockDbResult(buildCase({ billing_status: 'free' }));

    const result = await validateAndStoreSession('PF-TEST-0001');

    expect(result.success).toBe(true);
    expect(result.isUnlocked).toBe(true);
    expect(cookieSetMock).toHaveBeenCalledOnce();
  });

  // --------------------------------------------------------------------------
  // 🎯 KERN-REGRESSION: frisch erzeugter Fall mit billing_status "pending"
  // (Das war der ursprüngliche Bug: erstellen → schließen → wieder laden schlug fehl)
  // --------------------------------------------------------------------------

  it('akzeptiert einen unbezahlten Fall (pending) als GÜLTIGE Session mit Cookie', async () => {
    mockDbResult(buildCase({ billing_status: 'pending' }));

    const result = await validateAndStoreSession('PF-TEST-0001');

    // Session gültig, aber Premium gesperrt — das ist die entscheidende Trennung
    expect(result.success).toBe(true);
    expect(result.isUnlocked).toBe(false);
    expect(result.isExpired).toBe(false);
    expect(result.caseCode).toBe('PF-TEST-0001');

    // Cookie MUSS trotz "pending" gesetzt werden
    expect(cookieSetMock).toHaveBeenCalledExactlyOnceWith(
      CASE_COOKIE,
      'PF-TEST-0001',
      expect.objectContaining({ httpOnly: true })
    );
  });

  // --------------------------------------------------------------------------
  // Beta-Ablauf: exakt 12 Monate ("Eiserne Regel")
  // --------------------------------------------------------------------------

  it('sperrt Beta-Fälle nach Ablauf von 12 Monaten (success=true, isExpired=true)', async () => {
    // Aktivierung März 2025, Gegenwart Juli 2026 → deutlich über 12 Monate
    mockDbResult(
      buildCase({
        case_code: 'BETA999',
        billing_status: 'paid',
        product_tier: 'beta',
        access_activated_at: '2025-03-01T12:00:00.000Z',
      })
    );

    const result = await validateAndStoreSession('BETA999');

    // Der Fall EXISTIERT — die UI soll "abgelaufen" erklären, nicht "ungültig"
    expect(result.success).toBe(true);
    expect(result.isExpired).toBe(true);
    expect(result.isUnlocked).toBe(false);
    expect(result.caseCode).toBe('BETA999');

    // Kein neues Cookie, altes wird entwertet
    expect(cookieSetMock).not.toHaveBeenCalled();
    expect(cookieDeleteMock).toHaveBeenCalledWith(CASE_COOKIE);
  });

  it('lässt Beta-Fälle INNERHALB der 12 Monate normal passieren', async () => {
    // Aktivierung vor 11 Monaten (August 2025) → noch gültig
    mockDbResult(
      buildCase({
        product_tier: 'beta',
        billing_status: 'paid',
        access_activated_at: '2025-08-12T12:00:00.000Z',
      })
    );

    const result = await validateAndStoreSession('PF-TEST-0001');

    expect(result.isExpired).toBe(false);
    expect(result.isUnlocked).toBe(true);
    expect(cookieSetMock).toHaveBeenCalledOnce();
  });

  it('Grenzfall: einen Tag VOR Ablauf ist der Beta-Zugang noch gültig', async () => {
    // Aktivierung 2025-07-13 → Ablauf 2026-07-13, Gegenwart 2026-07-12
    mockDbResult(
      buildCase({
        product_tier: 'beta',
        access_activated_at: '2025-07-13T12:00:00.000Z',
      })
    );

    const result = await validateAndStoreSession('PF-TEST-0001');

    expect(result.isExpired).toBe(false);
  });

  it('Grenzfall: einen Tag NACH Ablauf ist der Beta-Zugang gesperrt', async () => {
    // Aktivierung 2025-07-11 → Ablauf 2026-07-11, Gegenwart 2026-07-12
    mockDbResult(
      buildCase({
        product_tier: 'beta',
        access_activated_at: '2025-07-11T12:00:00.000Z',
      })
    );

    const result = await validateAndStoreSession('PF-TEST-0001');

    expect(result.isExpired).toBe(true);
  });

  it('prüft NICHT-Beta-Fälle nie auf Ablauf, auch bei uraltem Aktivierungsdatum', async () => {
    mockDbResult(
      buildCase({
        product_tier: 'standard',
        access_activated_at: '2020-01-01T00:00:00.000Z', // 6 Jahre alt
      })
    );

    const result = await validateAndStoreSession('PF-TEST-0001');

    expect(result.isExpired).toBe(false);
    expect(cookieSetMock).toHaveBeenCalledOnce();
  });

  it('überspringt die Ablauf-Prüfung, wenn access_activated_at fehlt (Beta ohne Aktivierung)', async () => {
    mockDbResult(
      buildCase({
        product_tier: 'beta',
        access_activated_at: null,
      })
    );

    const result = await validateAndStoreSession('PF-TEST-0001');

    expect(result.isExpired).toBe(false);
    expect(result.success).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Cookie-Sicherheit (secure-Flag abhängig von der Umgebung)
  // --------------------------------------------------------------------------

  it('setzt secure=true in Produktion', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    mockDbResult(buildCase());

    await validateAndStoreSession('PF-TEST-0001');

    expect(cookieSetMock).toHaveBeenCalledWith(
      CASE_COOKIE,
      expect.any(String),
      expect.objectContaining({ secure: true })
    );
  });

  it('setzt secure=false in Development (localhost ohne HTTPS)', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    mockDbResult(buildCase());

    await validateAndStoreSession('PF-TEST-0001');

    expect(cookieSetMock).toHaveBeenCalledWith(
      CASE_COOKIE,
      expect.any(String),
      expect.objectContaining({ secure: false })
    );
  });

  // --------------------------------------------------------------------------
  // Harte Fehler (DB down, Timeout, geworfene Exceptions)
  // --------------------------------------------------------------------------

  it('fängt geworfene Exceptions ab und liefert billingStatus "failed"', async () => {
    supabaseEqMock.mockReturnValue({ single: supabaseSingleMock });
    supabaseSingleMock.mockRejectedValue(new Error('Connection timeout'));

    const result = await validateAndStoreSession('PF-TEST-0001');

    expect(result).toEqual({
      success: false,
      isUnlocked: false,
      isExpired: false,
      billingStatus: 'failed',
      caseCode: null,
    });
    expect(cookieSetMock).not.toHaveBeenCalled();
  });
});

// ============================================================================
// ✅ TESTS: clearCaseSession
// ============================================================================

describe('clearCaseSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('löscht das Session-Cookie serverseitig', async () => {
    await clearCaseSession();

    expect(cookieDeleteMock).toHaveBeenCalledExactlyOnceWith(CASE_COOKIE);
    expect(cookieSetMock).not.toHaveBeenCalled();
  });
});
