// @vitest-environment node
// src/lib/logger.test.ts
//
// Node-Umgebung ist hier Pflicht: Unter jsdom könnte pino zur Browser-Fassung
// auflösen, die `hooks.streamWrite` nicht kennt — der Test prüfte dann einen
// Logger, den es auf dem Server gar nicht gibt.
import pino from 'pino';
import { describe, expect, it } from 'vitest';

import { FALLCODE_ERSATZ } from './log-schwaerzung';
import { loggerOptionen } from './logger';

/** Ein Logger mit den echten Optionen, der in ein Array schreibt statt nach stdout. */
function testLogger() {
  const zeilen: string[] = [];
  // `transport` (nur in development gesetzt) und ein eigener Strom schließen sich aus.
  const optionen: pino.LoggerOptions = { ...loggerOptionen, level: 'debug' };
  delete optionen.transport;
  const log = pino(optionen, { write: (zeile: string) => zeilen.push(zeile) });
  return { log, ausgabe: () => zeilen.join('') };
}

describe('logger — Fallcodes erreichen das Log nicht (#145)', () => {
  it('schwärzt bekannte Feldnamen', () => {
    const { log, ausgabe } = testLogger();
    log.warn({ caseCode: 'PF-AB12-CD34', nested: { case_code: 'PF-AB12-CD34' } }, 'Test');

    expect(ausgabe()).not.toMatch(/PF-AB12-CD34/);
    expect(ausgabe()).toContain('[REDACTED]');
  });

  it('schwärzt Codes unter unbekannten Feldnamen und in der Nachricht', () => {
    const { log, ausgabe } = testLogger();
    log.warn({ key: 'PF-AB12-CD34', betreff: 'Fall PF-EEEE-FFFF' }, 'Fall PF-AB12-CD34 geladen');

    expect(ausgabe()).not.toMatch(/PF-AB12-CD34|PF-EEEE-FFFF/);
    expect(ausgabe()).toContain(FALLCODE_ERSATZ);
  });

  it('schwärzt Codes in Fehlermeldungen und Stacktraces', () => {
    const { log, ausgabe } = testLogger();
    log.error({ err: new Error('Fall nicht gefunden: PF-AB12-CD34') }, 'API-Fehler');

    expect(ausgabe()).not.toMatch(/PF-AB12-CD34/);
    expect(ausgabe()).toContain(FALLCODE_ERSATZ);
  });

  it('lässt Fehlercodes unter dem Feld `code` stehen', () => {
    const { log, ausgabe } = testLogger();
    log.warn({ code: 'NOT_FOUND' }, 'Test');

    expect(ausgabe()).toContain('NOT_FOUND');
  });

  it('schreibt überhaupt etwas — sonst wären die Prüfungen oben wertlos', () => {
    const { log, ausgabe } = testLogger();
    log.info('lebt');

    expect(ausgabe()).toContain('lebt');
  });
});
