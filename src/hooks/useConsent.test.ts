import { describe, it, expect, beforeEach, vi } from 'vitest';

import { parseConsentString } from './useConsent';

const { errorMock, debugMock } = vi.hoisted(() => ({
  errorMock: vi.fn(),
  debugMock: vi.fn(),
}));

vi.mock('@/src/lib/logger', () => ({
  logger: {
    error: errorMock,
    debug: debugMock,
  },
}));

describe('parseConsentString', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false when no consent data exists', () => {
    expect(parseConsentString(null)).toBe(false);
    expect(debugMock).toHaveBeenCalledTimes(1); // Noch präziser
    expect(debugMock).toHaveBeenCalledWith('Keine Consent-Daten im localStorage gefunden');
  });

  it('returns true when analytics consent is granted', () => {
    expect(parseConsentString(JSON.stringify({ analytics: true }))).toBe(true);
  });

  it('returns false when analytics consent is denied', () => {
    expect(parseConsentString(JSON.stringify({ analytics: false }))).toBe(false);
  });

  it('logs an error when consent data is invalid JSON', () => {
    expect(parseConsentString('{invalid-json')).toBe(false);
    expect(errorMock).toHaveBeenCalledTimes(1);
  });
});
