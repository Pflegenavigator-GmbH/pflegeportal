import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { berechneFrist, formatiereFristInfo } from './utils';

describe('Widerspruch Fristen-Logik', () => {
  // Wir "frieren" das heutige Datum ein, damit die Tests immer konsistent sind
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-12T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sollte bei einem Bescheid von vor 2 Tagen im grünen Bereich sein', () => {
    const frist = berechneFrist(new Date('2026-06-10'));

    expect(frist.ampelStatus).toBe('gruen');
    expect(frist.istAbgelaufen).toBe(false);
  });

  it('sollte bei drei verbleibenden Tagen gelb zeigen (Schwelle 3–14 Tage)', () => {
    // Heute ist der 12.06., die Frist endet am 15.06. → 3 Tage → gelb
    const frist = berechneFrist('2026-05-15');

    expect(frist.verbleibendeTage).toBe(3);
    expect(frist.ampelStatus).toBe('gelb');
  });

  it('sollte erst unterhalb von drei Tagen auf rot springen', () => {
    // Einen Tag später betrachtet: Frist endet weiterhin am 15.06. → 2 Tage.
    vi.setSystemTime(new Date('2026-06-13T12:00:00Z'));
    const frist = berechneFrist('2026-05-15');

    expect(frist.verbleibendeTage).toBe(2);
    expect(frist.ampelStatus).toBe('rot');
  });

  it('sollte Feiertage/Wochenenden beim Fristende überspringen', () => {
    // 03.10.2026 ist ein Feiertag (Tag der Deutschen Einheit) und ein Samstag.
    const frist = berechneFrist('2026-09-03');

    expect(frist.fristEndeWerktag.getDay()).not.toBe(0); // Sonntag
    expect(frist.fristEndeWerktag.getDay()).not.toBe(6); // Samstag
  });

  it('sollte die korrekte Rechtsgrundlage je Verfahrenstyp zitieren', () => {
    expect(berechneFrist('2026-06-01', 'pflegegrad').gesetz).toBe('§ 84 Abs. 1 SGG');
    expect(berechneFrist('2026-06-01', 'klage').gesetz).toBe('§ 87 Abs. 1 SGG');
    expect(berechneFrist('2026-06-01', 'mdk-gutachten').gesetz).toBe('§ 25 SGB X');
  });

  it('sollte ein unbrauchbares Bescheiddatum als Fehler melden', () => {
    expect(() => berechneFrist('2026-02-31')).toThrow(/Ungültiges Bescheiddatum/);
  });

  it('sollte die Fristinfo als Klartextzeile ausgeben', () => {
    expect(formatiereFristInfo(berechneFrist('2026-05-15'))).toContain('15.06.2026');
    expect(formatiereFristInfo(berechneFrist('2026-01-01'))).toContain('FRIST ABGELAUFEN');
  });
});
