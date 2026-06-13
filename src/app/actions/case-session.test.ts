import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { validateAndStoreSession } from '@/src/app/actions/case-session';

// 1. Spies für Supabase und Cookies über hoisted definieren
const { supabaseSelectMock, supabaseEqMock, supabaseSingleMock, cookieSetMock } = vi.hoisted(
  () => ({
    supabaseSelectMock: vi.fn(),
    supabaseEqMock: vi.fn(),
    supabaseSingleMock: vi.fn(),
    cookieSetMock: vi.fn(),
  })
);

// 2. Next.js Cookies mocken
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    set: cookieSetMock,
  }),
}));

// 3. Supabase-Client mocken (Fluent API / Method Chaining)
vi.mock('@/src/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnThis(),
    select: supabaseSelectMock,
    eq: supabaseEqMock,
    single: supabaseSingleMock,
  }),
}));

describe('validateAndStoreSession Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  // Nach den Zeit-Tests setzen wir die Systemzeit wieder zurück
  afterEach(() => {
    vi.useRealTimers();
  });

  it('sollte fehlschlagen, wenn der Fall in der DB nicht existiert', async () => {
    supabaseSelectMock.mockReturnThis();
    supabaseEqMock.mockReturnThis();
    supabaseSingleMock.mockResolvedValue({ data: null, error: new Error('Not found') });

    const result = await validateAndStoreSession('NOTFOUND');

    expect(result.success).toBe(false);
    expect(result.caseCode).toBeNull();
    expect(cookieSetMock).not.toHaveBeenCalled();
  });

  it('sollte erfolgreich freischalten und ein Cookie setzen bei gültiger Zahlung', async () => {
    const mockCase = {
      case_code: 'CASE123',
      billing_status: 'paid',
      access_activated_at: '2026-01-01T12:00:00.000Z',
      product_tier: 'standard',
    };

    supabaseSelectMock.mockReturnThis();
    supabaseEqMock.mockReturnThis();
    supabaseSingleMock.mockResolvedValue({ data: mockCase, error: null });

    const result = await validateAndStoreSession('case123'); // Klein/Großschreibung testen

    expect(result).toEqual({
      success: true,
      isUnlocked: true,
      isExpired: false,
      billingStatus: 'paid',
      caseCode: 'CASE123',
    });

    // Validieren, ob das HTTP-Only Cookie korrekt konfiguriert wurde
    expect(cookieSetMock).toHaveBeenCalledWith(
      'pf_case_code',
      'CASE123',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
      })
    );
  });

  it('sollte Beta-Tester nach Ablauf von 12 Monaten sperren (Eiserne Regel)', async () => {
    // Systemzeit auf Juni 2026 fixieren
    vi.setSystemTime(new Date('2026-06-01T12:00:00.000Z'));

    // Aktivierung war im März 2025 -> Also mehr als 12 Monate her
    const expiredBetaCase = {
      case_code: 'BETA999',
      billing_status: 'paid',
      access_activated_at: '2025-03-01T12:00:00.000Z',
      product_tier: 'beta',
    };

    supabaseSelectMock.mockReturnThis();
    supabaseEqMock.mockReturnThis();
    supabaseSingleMock.mockResolvedValue({ data: expiredBetaCase, error: null });

    const result = await validateAndStoreSession('BETA999');

    expect(result.isUnlocked).toBe(false);
    expect(result.isExpired).toBe(true);
    expect(cookieSetMock).not.toHaveBeenCalled();
  });
});
