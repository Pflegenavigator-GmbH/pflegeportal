import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

/**
 * `laufend` und die Schlange liegen modulweit. Jeder Test lädt das Modul
 * deshalb frisch, statt eine Rücksetzfunktion einzuführen, die es nur wegen
 * der Tests gäbe.
 */
async function ladeWarteschlange() {
  vi.resetModules();
  return import('./warteschlange');
}

/** Eine Arbeit, die erst auf Zuruf fertig wird. */
function steuerbareArbeit() {
  let fertig!: () => void;
  let scheitert!: (fehler: Error) => void;
  const versprechen = new Promise<string>((resolve, reject) => {
    fertig = () => resolve('fertig');
    scheitert = reject;
  });
  return { versprechen, fertig, scheitert };
}

describe('PDF-Warteschlange (#177)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv('PDF_MAX_PARALLEL', '1');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('lässt nur so viele Renderings gleichzeitig zu wie erlaubt', async () => {
    const { mitPdfPlatz, warteschlangeZustand } = await ladeWarteschlange();
    const erste = steuerbareArbeit();
    const zweite = steuerbareArbeit();
    const gestartet: string[] = [];

    const laufA = mitPdfPlatz(() => {
      gestartet.push('a');
      return erste.versprechen;
    });
    const laufB = mitPdfPlatz(() => {
      gestartet.push('b');
      return zweite.versprechen;
    });

    await vi.advanceTimersByTimeAsync(0);

    // Das zweite Rendering darf noch nicht begonnen haben.
    expect(gestartet).toEqual(['a']);
    expect(warteschlangeZustand()).toMatchObject({ laufend: 1, wartend: 1 });

    erste.fertig();
    await vi.advanceTimersByTimeAsync(0);

    expect(gestartet).toEqual(['a', 'b']);

    zweite.fertig();
    await expect(laufA).resolves.toBe('fertig');
    await expect(laufB).resolves.toBe('fertig');
  });

  it('gibt den Platz auch frei, wenn das Rendering scheitert', async () => {
    const { mitPdfPlatz, warteschlangeZustand } = await ladeWarteschlange();
    const erste = steuerbareArbeit();

    const lauf = mitPdfPlatz(() => erste.versprechen);
    await vi.advanceTimersByTimeAsync(0);

    erste.scheitert(new Error('Chromium abgestürzt'));
    await expect(lauf).rejects.toThrow('Chromium abgestürzt');

    // Ein einziges fehlgeschlagenes Rendering darf die Schlange nicht
    // dauerhaft verstopfen.
    expect(warteschlangeZustand()).toMatchObject({ laufend: 0, wartend: 0 });
    await expect(mitPdfPlatz(async () => 'geht wieder')).resolves.toBe('geht wieder');
  });

  it('lehnt ab, wenn die Schlange voll ist — statt den Server zu überladen', async () => {
    vi.stubEnv('PDF_MAX_WARTEPLAETZE', '2');
    const { mitPdfPlatz } = await ladeWarteschlange();
    const laufende = steuerbareArbeit();

    const laufend = mitPdfPlatz(() => laufende.versprechen);
    const wartend = [mitPdfPlatz(async () => 'a'), mitPdfPlatz(async () => 'b')];
    await vi.advanceTimersByTimeAsync(0);

    await expect(mitPdfPlatz(async () => 'c')).rejects.toMatchObject({
      statusCode: 429,
      name: 'RateLimitError',
    });

    laufende.fertig();
    await vi.advanceTimersByTimeAsync(0);
    await Promise.all([laufend, ...wartend]);
  });

  it('lehnt ab, wenn das Warten zu lange dauert', async () => {
    vi.stubEnv('PDF_WARTEZEIT_MS', '5000');
    const { mitPdfPlatz, warteschlangeZustand } = await ladeWarteschlange();
    const laufende = steuerbareArbeit();

    const laufend = mitPdfPlatz(() => laufende.versprechen);
    const wartend = mitPdfPlatz(async () => 'kommt nie dran');
    await vi.advanceTimersByTimeAsync(0);

    // Die Erwartung wird VOR dem Vorspulen angelegt: Die Ablehnung fällt
    // mitten im Zeitsprung an, und eine erst danach angehängte Behandlung
    // gilt als unbehandelte Zurückweisung.
    const abgelehnt = expect(wartend).rejects.toMatchObject({ statusCode: 429 });

    await vi.advanceTimersByTimeAsync(5000);
    await abgelehnt;
    expect(warteschlangeZustand().wartend).toBe(0);

    laufende.fertig();
    await expect(laufend).resolves.toBe('fertig');
  });

  it('fällt bei unsinniger Konfiguration auf die Vorgabe zurück', async () => {
    vi.stubEnv('PDF_MAX_PARALLEL', 'viele');
    const { warteschlangeZustand } = await ladeWarteschlange();

    expect(warteschlangeZustand().grenze).toBe(1);
  });
});
