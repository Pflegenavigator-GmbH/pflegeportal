// src/app/actions/case-session.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { validateAndStoreSession, clearCaseSession } from '@/src/app/actions/case-session';
import { berechneCaseCodeHash } from '@/src/lib/case-code-server';

// `case-code-server` ist mit `server-only` markiert — im Test wie überall
// sonst im Repo neutralisiert.
vi.mock('server-only', () => ({}));

// ============================================================================
// 🧪 MOCK-SETUP
// ============================================================================

// 1. Spies über vi.hoisted definieren, damit die vi.mock-Factories darauf zugreifen können
const { supabaseEqMock, supabaseSingleMock, erzeugeSitzungMock, beendeSitzungMock } = vi.hoisted(
  () => ({
    supabaseEqMock: vi.fn(),
    supabaseSingleMock: vi.fn(),
    erzeugeSitzungMock: vi.fn(),
    beendeSitzungMock: vi.fn(),
  })
);

// Seit #135 legt die Action keine Cookies mehr selbst an, sondern delegiert an
// den Sitzungsbestand. Geprüft wird hier die Entscheidung, nicht das Cookie —
// dessen Eigenschaften prüft `src/lib/api/session.test.ts`.
vi.mock('@/src/lib/api/session', () => ({
  erzeugeSitzung: erzeugeSitzungMock,
  beendeSitzung: beendeSitzungMock,
}));

// 3. Supabase-Admin-Client mocken (Fluent API: from → select → eq → single)
vi.mock('@/src/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn().mockReturnValue({
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
  id: string;
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
    id: 'case-uuid-1',
    case_code: 'PF-TEST-0001',
    billing_status: 'paid',
    access_activated_at: '2026-01-01T12:00:00.000Z',
    product_tier: 'standard',
    ...overrides,
  };
}

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

  it('normalisiert den Fallcode und sucht über den Hash, nicht über den Klartext', async () => {
    mockDbResult(buildCase({ case_code: 'PF-ABCD-1234' }));

    await validateAndStoreSession('  pf-abcd-1234  ');

    // Der Klartext verlässt die Anwendung nicht mehr Richtung Datenbank (#153);
    // gesucht wird über den aus der normalisierten Form abgeleiteten Schlüssel.
    expect(supabaseEqMock).toHaveBeenCalledWith(
      'case_code_hash',
      berechneCaseCodeHash('PF-ABCD-1234')
    );
  });

  // --------------------------------------------------------------------------
  // Fall nicht gefunden / DB-Fehler
  // --------------------------------------------------------------------------

  it('schlägt fehl, wenn der Fall in der DB nicht existiert', async () => {
    mockDbResult(null, new Error('Not found'));

    const result = await validateAndStoreSession('PF-NOTF-0404');

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

    await validateAndStoreSession('PF-NOTF-0404');

    expect(beendeSitzungMock).toHaveBeenCalled();
    expect(erzeugeSitzungMock).not.toHaveBeenCalled();
  });

  it('behandelt data=null ohne error-Objekt ebenfalls als "nicht gefunden"', async () => {
    mockDbResult(null, null);

    const result = await validateAndStoreSession('PF-GHST-0404');

    expect(result.success).toBe(false);
    expect(result.billingStatus).toBe('not_found');
  });

  // --------------------------------------------------------------------------
  // Bezahlte / kostenlose Fälle → volle Freischaltung
  // --------------------------------------------------------------------------

  it('schaltet einen bezahlten Fall frei und setzt das Session-Cookie korrekt', async () => {
    mockDbResult(buildCase({ case_code: 'PF-CASE-0123', billing_status: 'paid' }));

    const result = await validateAndStoreSession('pf-case-0123');

    expect(result).toEqual({
      success: true,
      isUnlocked: true,
      isExpired: false,
      billingStatus: 'paid',
      caseCode: 'PF-CASE-0123',
    });

    expect(erzeugeSitzungMock).toHaveBeenCalledExactlyOnceWith('case-uuid-1');
  });

  it('behandelt billing_status "free" wie "paid" (isUnlocked=true)', async () => {
    mockDbResult(buildCase({ billing_status: 'free' }));

    const result = await validateAndStoreSession('PF-TEST-0001');

    expect(result.success).toBe(true);
    expect(result.isUnlocked).toBe(true);
    expect(erzeugeSitzungMock).toHaveBeenCalledExactlyOnceWith('case-uuid-1');
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
    expect(erzeugeSitzungMock).toHaveBeenCalledExactlyOnceWith('case-uuid-1');
  });

  // --------------------------------------------------------------------------
  // Beta-Ablauf: exakt 12 Monate ("Eiserne Regel")
  // --------------------------------------------------------------------------

  it('sperrt Beta-Fälle nach Ablauf von 12 Monaten (success=true, isExpired=true)', async () => {
    // Aktivierung März 2025, Gegenwart Juli 2026 → deutlich über 12 Monate
    mockDbResult(
      buildCase({
        case_code: 'PF-BETA-0999',
        billing_status: 'paid',
        product_tier: 'beta',
        access_activated_at: '2025-03-01T12:00:00.000Z',
      })
    );

    const result = await validateAndStoreSession('PF-BETA-0999');

    // Der Fall EXISTIERT — die UI soll "abgelaufen" erklären, nicht "ungültig"
    expect(result.success).toBe(true);
    expect(result.isExpired).toBe(true);
    expect(result.isUnlocked).toBe(false);
    expect(result.caseCode).toBe('PF-BETA-0999');

    // Kein neues Cookie, altes wird entwertet
    expect(erzeugeSitzungMock).not.toHaveBeenCalled();
    expect(beendeSitzungMock).toHaveBeenCalled();
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
    expect(erzeugeSitzungMock).toHaveBeenCalledExactlyOnceWith('case-uuid-1');
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
    expect(erzeugeSitzungMock).toHaveBeenCalledExactlyOnceWith('case-uuid-1');
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

  // ------------------------------------------------------------------------
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
    expect(erzeugeSitzungMock).not.toHaveBeenCalled();
  });
});

// ============================================================================
// ✅ TESTS: clearCaseSession
// ============================================================================

describe('clearCaseSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('beendet die Sitzung serverseitig', async () => {
    await clearCaseSession();

    // Widerruf statt nur Cookie löschen: Ein gelöschtes Cookie allein ließe die
    // Sitzung auf dem Server bis zum Ablauf gültig (#135).
    expect(beendeSitzungMock).toHaveBeenCalledOnce();
    expect(erzeugeSitzungMock).not.toHaveBeenCalled();
  });
});
