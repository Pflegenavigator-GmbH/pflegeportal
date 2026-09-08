import { describe, expect, it } from 'vitest';

import { sauberFuerLog } from './log-safe';

describe('sauberFuerLog', () => {
  it('entfernt Zeilenumbrüche (die eigentliche Log-Injection-Gefahr)', () => {
    // Ein Angreifer könnte über \n eine zweite, gefälschte Log-Zeile einschleusen.
    const boeswillig = 'harmlos\n[edge-cache] Admin-Login erfolgreich';
    const sauber = sauberFuerLog(boeswillig);
    expect(sauber).not.toContain('\n');
    expect(sauber).toBe('harmlos [edge-cache] Admin-Login erfolgreich');
  });

  it('neutralisiert CR, LF und weitere Steuerzeichen', () => {
    // Jedes Steuerzeichen wird durch genau ein Leerzeichen ersetzt (1:1),
    // aus \r\n werden also zwei. Das ist gewollt: die Länge bleibt erhalten
    // und die Ersetzung ist ohne Regex-Kollaps nachvollziehbar.
    expect(sauberFuerLog('a\r\nb\tc d')).toBe('a  b c d');
    expect(sauberFuerLog('a\nb\nc')).toBe('a b c');
  });

  it('lässt keine Steuerzeichen übrig', () => {
    // Gegenprobe über den gesamten C0-Bereich plus DEL.
    const alleSteuerzeichen = Array.from({ length: 0x20 }, (_, i) => String.fromCharCode(i))
      .concat('\x7F')
      .join('');
    const sauber = sauberFuerLog(alleSteuerzeichen, 500);

    expect(sauber).toBe(' '.repeat(0x21));
    expect(/[\x00-\x1F\x7F]/.test(sauber)).toBe(false);
  });

  it('lässt normalen Text unverändert', () => {
    expect(sauberFuerLog('mw:cache:/api/gesetze?sgb=xi')).toBe('mw:cache:/api/gesetze?sgb=xi');
  });

  it('kappt überlange Eingaben gegen Log-Flooding', () => {
    const lang = 'x'.repeat(500);
    const sauber = sauberFuerLog(lang, 200);
    expect(sauber).toHaveLength(201); // 200 Zeichen + Ellipse
    expect(sauber.endsWith('…')).toBe(true);
  });

  it('behandelt Nicht-Strings robust', () => {
    expect(sauberFuerLog(null)).toBe('null');
    expect(sauberFuerLog(42)).toBe('42');
    expect(sauberFuerLog(undefined)).toBe('undefined');
  });
});
