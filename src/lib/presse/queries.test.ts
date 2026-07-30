import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createPublicSupabaseClient } from '@/src/lib/supabase/public';

import { ladeMeldung, ladeMeldungen } from './queries';

// 'server-only' wirft in der jsdom-Testumgebung (Client-Kontext); neutralisieren.
vi.mock('server-only', () => ({}));
vi.mock('@/src/lib/supabase/public', () => ({ createPublicSupabaseClient: vi.fn() }));

const createClientMock = vi.mocked(createPublicSupabaseClient);

interface Zeile {
  id: string;
  locale: string;
  title: string;
  slug: string;
  subtitle: string | null;
  summary: string | null;
  category: string;
  published_at: string | null;
}

/** Protokolliert eine Query und liefert die für die Locale hinterlegten Zeilen. */
function fakeClient(datenNachLocale: Record<string, Zeile[]>, protokoll: Record<string, unknown>) {
  const builder = {
    _locale: undefined as string | undefined,
    select() {
      return this;
    },
    eq(spalte: string, wert: string) {
      if (spalte === 'status') protokoll.statusFilter = wert;
      if (spalte === 'locale') this._locale = wert;
      if (spalte === 'category') protokoll.category = wert;
      return this;
    },
    order() {
      return this;
    },
    textSearch(_spalte: string, suche: string, opts: unknown) {
      protokoll.suche = suche;
      protokoll.sucheOpts = opts;
      return this;
    },
    then(resolve: (r: { data: Zeile[]; error: null }) => void) {
      resolve({ data: datenNachLocale[this._locale ?? ''] ?? [], error: null });
    },
  };
  return { from: () => builder } as unknown as ReturnType<typeof createPublicSupabaseClient>;
}

const zeile = (over: Partial<Zeile> = {}): Zeile => ({
  id: 'x',
  locale: 'de',
  title: 'Titel',
  slug: 'titel',
  subtitle: null,
  summary: null,
  category: 'recht',
  published_at: '2026-06-02',
  ...over,
});

describe('ladeMeldungen', () => {
  beforeEach(() => createClientMock.mockReset());

  it('filtert immer auf published und mappt auf das Frontend-Format', async () => {
    const protokoll: Record<string, unknown> = {};
    createClientMock.mockReturnValue(fakeClient({ de: [zeile({ id: '1' })] }, protokoll));

    const meldungen = await ladeMeldungen({ locale: 'de' });

    expect(protokoll.statusFilter).toBe('published');
    expect(protokoll.category).toBeUndefined(); // ohne Filter kein category-eq
    expect(protokoll.suche).toBeUndefined(); // ohne Suche kein textSearch
    expect(meldungen).toEqual([
      expect.objectContaining({ id: '1', publishedAt: '2026-06-02', category: 'recht' }),
    ]);
  });

  it('wendet den Kategoriefilter nur bei konkreter Kategorie an', async () => {
    const protokoll: Record<string, unknown> = {};
    createClientMock.mockReturnValue(fakeClient({ de: [] }, protokoll));

    await ladeMeldungen({ locale: 'de', kategorie: 'statistik' });
    expect(protokoll.category).toBe('statistik');
  });

  it('nutzt die Volltextsuche nur bei nicht-leerem Suchbegriff', async () => {
    const protokoll: Record<string, unknown> = {};
    createClientMock.mockReturnValue(fakeClient({ de: [] }, protokoll));

    await ladeMeldungen({ locale: 'de', suche: '  Budget  ' });
    expect(protokoll.suche).toBe('Budget'); // getrimmt
    expect(protokoll.sucheOpts).toMatchObject({ type: 'websearch', config: 'german' });
  });

  it('fällt auf Deutsch zurück, wenn die Sprache leer ausgeht', async () => {
    // 'tr' hat keine Meldungen, 'de' schon → Ergebnis kommt aus 'de'.
    const daten = { tr: [], de: [zeile({ id: 'de-1', locale: 'de' })] };
    createClientMock.mockImplementation(() => fakeClient(daten, {}));

    const meldungen = await ladeMeldungen({ locale: 'tr' });

    expect(meldungen).toHaveLength(1);
    expect(meldungen[0].id).toBe('de-1');
  });

  it('fällt NICHT zurück, wenn die Sprache selbst Treffer hat', async () => {
    const daten = { tr: [zeile({ id: 'tr-1', locale: 'tr' })], de: [zeile({ id: 'de-1' })] };
    createClientMock.mockImplementation(() => fakeClient(daten, {}));

    const meldungen = await ladeMeldungen({ locale: 'tr' });
    expect(meldungen[0].id).toBe('tr-1');
  });

  it('liefert bei einem DB-Fehler eine leere Liste statt zu werfen', async () => {
    const fehlerClient = {
      from: () => ({
        select() {
          return this;
        },
        eq() {
          return this;
        },
        order() {
          return this;
        },
        then(resolve: (r: { data: null; error: { message: string } }) => void) {
          resolve({ data: null, error: { message: 'relation does not exist' } });
        },
      }),
    } as unknown as ReturnType<typeof createPublicSupabaseClient>;
    createClientMock.mockReturnValue(fehlerClient);

    await expect(ladeMeldungen({ locale: 'de' })).resolves.toEqual([]);
  });
});

/** Detail-Query terminiert mit `.maybeSingle()` (ein Objekt oder null). */
function fakeDetailClient(nachSchluessel: Record<string, Zeile | null>) {
  const builder = {
    _locale: undefined as string | undefined,
    _slug: undefined as string | undefined,
    select() {
      return this;
    },
    eq(spalte: string, wert: string) {
      if (spalte === 'locale') this._locale = wert;
      if (spalte === 'slug') this._slug = wert;
      return this;
    },
    maybeSingle() {
      return Promise.resolve({
        data: nachSchluessel[`${this._locale}:${this._slug}`] ?? null,
        error: null,
      });
    },
  };
  return { from: () => builder } as unknown as ReturnType<typeof createPublicSupabaseClient>;
}

describe('ladeMeldung (Detail)', () => {
  beforeEach(() => createClientMock.mockReset());

  it('liefert die Meldung der angefragten Sprache', async () => {
    createClientMock.mockImplementation(() =>
      fakeDetailClient({ 'de:mein-slug': zeile({ id: 'de-1', slug: 'mein-slug' }) })
    );

    const meldung = await ladeMeldung('mein-slug', 'de');
    expect(meldung?.id).toBe('de-1');
  });

  it('fällt auf Deutsch zurück, wenn die Sprache den Slug nicht hat', async () => {
    createClientMock.mockImplementation(() =>
      fakeDetailClient({
        'tr:mein-slug': null,
        'de:mein-slug': zeile({ id: 'de-1', slug: 'mein-slug' }),
      })
    );

    const meldung = await ladeMeldung('mein-slug', 'tr');
    expect(meldung?.id).toBe('de-1');
  });

  it('liefert null, wenn der Slug auch auf Deutsch fehlt', async () => {
    createClientMock.mockImplementation(() => fakeDetailClient({}));
    await expect(ladeMeldung('gibt-es-nicht', 'de')).resolves.toBeNull();
  });
});
