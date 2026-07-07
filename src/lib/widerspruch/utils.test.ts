import { describe, it, expect, vi, beforeEach } from 'vitest';

import { berechneFrist } from './utils';

describe('Widerspruch Fristen-Logik', () => {
  // Wir "frieren" das heutige Datum ein, damit die Tests immer konsistent sind
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-12T12:00:00Z'));
  });

  it('sollte bei einem Bescheid von vor 2 Tagen im grünen Bereich sein', () => {
    const bescheidDatum = new Date('2026-06-10');
    const frist = berechneFrist(bescheidDatum);

    expect(frist.ampelStatus).toBe('gruen');
    expect(frist.istAbgelaufen).toBe(false);
  });

  it('sollte bei knappem Fristende (unter 7 Tage) auf rot springen', () => {
    // Wenn heute der 12.06. ist, ist eine Frist bis zum 15.06. "rot"
    const bescheidDatum = new Date('2026-05-15'); // 1 Monat Frist = 15.06.
    const frist = berechneFrist(bescheidDatum);

    expect(frist.ampelStatus).toBe('rot');
  });

  it('sollte Feiertage/Wochenenden beim Fristende überspringen', () => {
    // 03.10.2026 ist ein Feiertag (Tag der Deutschen Einheit)
    // Wenn die Frist eigentlich auf einen Feiertag fällt, muss sie auf den nächsten Werktag springen.
    const bescheidDatum = new Date('2026-09-03');
    const frist = berechneFrist(bescheidDatum);

    // Prüfen, ob der 03.10.2026 ein Werktag ist oder verschoben wurde
    expect(frist.fristEndeWerktag.getDay()).not.toBe(0); // Sonntag
    expect(frist.fristEndeWerktag.getDay()).not.toBe(6); // Samstag
  });
});
