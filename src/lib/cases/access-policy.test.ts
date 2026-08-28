import { describe, expect, it } from 'vitest';

import { evaluateCaseAccess, isValidCaseCode, normalizeCaseCode } from './access-policy';

describe('Fall-Zugriffsrichtlinie', () => {
  it('normalisiert und validiert bestehende Fallcode-Formate zentral', () => {
    expect(normalizeCaseCode('  pf-abcd-1234 ')).toBe('PF-ABCD-1234');
    expect(isValidCaseCode('case123')).toBe(true);
    expect(isValidCaseCode('x')).toBe(false);
  });

  it('trennt eine gültige Session von einer Premium-Freischaltung', () => {
    expect(
      evaluateCaseAccess({
        billing_status: 'pending',
        product_tier: 'standard',
        access_activated_at: null,
      })
    ).toEqual({ isExpired: false, isUnlocked: false });
  });

  it('entzieht einem abgelaufenen Beta-Fall auch bei paid die Freischaltung', () => {
    expect(
      evaluateCaseAccess(
        {
          billing_status: 'paid',
          product_tier: 'beta',
          access_activated_at: '2025-01-01T00:00:00.000Z',
        },
        new Date('2026-01-02T00:00:00.000Z')
      )
    ).toEqual({ isExpired: true, isUnlocked: false });
  });
});
