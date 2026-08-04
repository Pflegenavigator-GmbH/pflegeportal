// src/lib/presse/queries.ts
import 'server-only';

import { logger } from '@/src/lib/logger';
import { createPublicSupabaseClient } from '@/src/lib/supabase/public';

import {
  KATEGORIE_ALLE,
  istPresseKategorie,
  normalisiereKategorie,
  type KategorieFilter,
  type PresseKategorie,
} from './kategorien';

/** Eine Pressemeldung in der Listenansicht. */
export interface Meldung {
  id: string;
  locale: string;
  title: string;
  slug: string;
  subtitle: string | null;
  summary: string | null;
  /**
   * Enger Typ statt `string`: Die Spalte hat in der Datenbank einen
   * CHECK-Constraint auf genau diese Werte. Erst dadurch lässt sich
   * `t(`kategorie.${category}`)` gegen die vorhandenen Schlüssel prüfen.
   */
  category: PresseKategorie;
  publishedAt: string | null;
}

/** Vollständige Meldung für die Detailseite (inkl. Langtext + SEO). */
export interface MeldungDetail extends Meldung {
  contentHtml: string | null;
  seoMeta: { title?: string; description?: string } | null;
}

export interface MeldungsFilter {
  locale: string;
  kategorie?: KategorieFilter;
  suche?: string;
}

/** Standard-Sprache, auf die zurückgefallen wird (Produkt-Entscheidung). */
const FALLBACK_LOCALE = 'de';

/** Nur die im Frontend benötigten Spalten — kein `content_html`/`seo_meta`. */
const SPALTEN = 'id, locale, title, slug, subtitle, summary, category, published_at';

interface PostZeile {
  id: string;
  locale: string;
  title: string;
  slug: string;
  subtitle: string | null;
  summary: string | null;
  category: string;
  published_at: string | null;
}

function zuMeldung(zeile: PostZeile): Meldung {
  return {
    id: zeile.id,
    locale: zeile.locale,
    title: zeile.title,
    slug: zeile.slug,
    subtitle: zeile.subtitle,
    summary: zeile.summary,
    // Fällt ein unerwarteter Wert aus der Datenbank, lieber die
    // allgemeinste Kategorie als ein fehlender Übersetzungsschlüssel.
    category: istPresseKategorie(zeile.category) ? zeile.category : 'produktlaunch',
    publishedAt: zeile.published_at,
  };
}

/**
 * Liest veröffentlichte Meldungen für eine Sprache — mit Filter und
 * Volltextsuche.
 *
 * - Nur `status = 'published'` (durchgesetzt zusätzlich per RLS).
 * - Volltextsuche über den `search_vector` (Postgres `websearch`-Syntax).
 * - Kategoriefilter optional.
 * - Deutsch-Fallback: Gibt es in der angefragten Sprache keine Treffer, wird
 *   dieselbe Abfrage auf Deutsch wiederholt — so sehen Nutzer immer Inhalte.
 *
 * Robust: Bei einem DB-Fehler (z.B. Migration noch nicht ausgeführt) wird eine
 * leere Liste geliefert, statt die Seite zu brechen.
 */
export async function ladeMeldungen(filter: MeldungsFilter): Promise<Meldung[]> {
  const kategorie = normalisiereKategorie(filter.kategorie);
  const suche = filter.suche?.trim();

  const treffer = await frageAb(filter.locale, kategorie, suche);

  // Fallback auf Deutsch nur, wenn die angefragte Sprache leer ausging.
  if (treffer.length === 0 && filter.locale !== FALLBACK_LOCALE) {
    return frageAb(FALLBACK_LOCALE, kategorie, suche);
  }
  return treffer;
}

async function frageAb(
  locale: string,
  kategorie: KategorieFilter,
  suche?: string
): Promise<Meldung[]> {
  const supabase = createPublicSupabaseClient();

  let query = supabase
    .from('posts')
    .select(SPALTEN)
    .eq('status', 'published')
    .eq('locale', locale)
    .order('published_at', { ascending: false });

  if (kategorie !== KATEGORIE_ALLE) {
    query = query.eq('category', kategorie);
  }
  if (suche) {
    query = query.textSearch('search_vector', suche, { type: 'websearch', config: 'german' });
  }

  const { data, error } = await query;

  if (error) {
    logger.error({ error, locale, kategorie }, 'Presse-Meldungen konnten nicht geladen werden');
    return [];
  }

  return (data ?? []).map(zuMeldung);
}

interface DetailZeile extends PostZeile {
  content_html: string | null;
  seo_meta: { title?: string; description?: string } | null;
}

/**
 * Lädt eine einzelne veröffentlichte Meldung per Slug — mit Deutsch-Fallback.
 * Liefert `null`, wenn es sie (auch auf Deutsch) nicht gibt → Detailseite 404.
 */
export async function ladeMeldung(slug: string, locale: string): Promise<MeldungDetail | null> {
  const treffer = await frageEineAb(slug, locale);
  if (treffer) return treffer;
  if (locale !== FALLBACK_LOCALE) return frageEineAb(slug, FALLBACK_LOCALE);
  return null;
}

async function frageEineAb(slug: string, locale: string): Promise<MeldungDetail | null> {
  const supabase = createPublicSupabaseClient();

  const { data, error } = await supabase
    .from('posts')
    .select(`${SPALTEN}, content_html, seo_meta`)
    .eq('status', 'published')
    .eq('locale', locale)
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    logger.error({ error, slug, locale }, 'Presse-Meldung konnte nicht geladen werden');
    return null;
  }
  if (!data) return null;

  const zeile = data as DetailZeile;
  return {
    ...zuMeldung(zeile),
    contentHtml: zeile.content_html,
    seoMeta: zeile.seo_meta,
  };
}

/**
 * Alle veröffentlichten Slugs je Sprache — für die statische Vorab-Generierung
 * der Detailseiten (generateStaticParams).
 */
export async function ladeVeroeffentlichteSlugs(): Promise<{ locale: string; slug: string }[]> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from('posts')
    .select('locale, slug')
    .eq('status', 'published');

  if (error) {
    logger.error({ error }, 'Presse-Slugs konnten nicht geladen werden');
    return [];
  }
  return (data ?? []).map((z) => ({ locale: z.locale, slug: z.slug }));
}
