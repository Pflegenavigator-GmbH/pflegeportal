'use client';

import { ArrowRight, Calendar, Search } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useCallback, useId, useRef, useState, type ReactNode } from 'react';

import {
  KATEGORIE_ALLE,
  PRESSE_KATEGORIEN,
  type KategorieFilter,
} from '@/src/lib/presse/kategorien';
import type { Meldung } from '@/src/lib/presse/queries';
import styles from '@/src/styles/presse.module.css';

interface Props {
  locale: string;
  /** Server-seitig vorgeladene Liste (ISR) — Erststand ohne Client-Fetch. */
  initialMeldungen: Meldung[];
  /** Statische, server-gerenderte Seitenspalte (Pressekontakt, Media Kit …). */
  sidebar: ReactNode;
}

const FILTER: KategorieFilter[] = [KATEGORIE_ALLE, ...PRESSE_KATEGORIEN];
const DEBOUNCE_MS = 250;

/**
 * Interaktiver Teil des Presseportals: Live-Suche + Kategoriefilter.
 *
 * Der Erststand kommt server-seitig (ISR/SEO). Jede Änderung fragt die
 * öffentliche Such-API ab (Postgres-Volltextsuche über `search_vector`).
 * Bewusst ohne Effekt-basiertes Fetching — die Abfrage hängt direkt an den
 * Interaktionen, Texteingaben werden entprellt.
 */
export function PresseClient({ locale, initialMeldungen, sidebar }: Props) {
  const t = useTranslations('presse');
  const suchId = useId();

  const [meldungen, setMeldungen] = useState<Meldung[]>(initialMeldungen);
  const [kategorie, setKategorie] = useState<KategorieFilter>(KATEGORIE_ALLE);
  const [suche, setSuche] = useState('');
  const [laedt, setLaedt] = useState(false);
  const entprellRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const datumsFormat = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const hole = useCallback(
    async (naechsteKategorie: KategorieFilter, naechsteSuche: string) => {
      setLaedt(true);
      try {
        const params = new URLSearchParams({ locale, kategorie: naechsteKategorie });
        if (naechsteSuche.trim()) params.set('q', naechsteSuche.trim());

        const antwort = await fetch(`/api/presse?${params.toString()}`);
        if (!antwort.ok) throw new Error(`Status ${antwort.status}`);
        const nutzlast = (await antwort.json()) as { data?: Meldung[] };
        setMeldungen(nutzlast.data ?? []);
      } catch {
        // Bei einem Fehler die bestehende Liste behalten statt zu leeren.
      } finally {
        setLaedt(false);
      }
    },
    [locale]
  );

  const beiKategorie = (naechste: KategorieFilter) => {
    setKategorie(naechste);
    void hole(naechste, suche);
  };

  const beiSuche = (wert: string) => {
    setSuche(wert);
    if (entprellRef.current) clearTimeout(entprellRef.current);
    entprellRef.current = setTimeout(() => void hole(kategorie, wert), DEBOUNCE_MS);
  };

  const kategorieLabel = (k: KategorieFilter) =>
    k === KATEGORIE_ALLE ? t('filter.alle') : t(`kategorie.${k}`);

  return (
    <>
      <div className={styles.leiste}>
        <nav className={styles.filterGruppe} aria-label={t('filter.alle')}>
          {FILTER.map((k) => {
            const aktiv = kategorie === k;
            return (
              <button
                key={k}
                type="button"
                aria-pressed={aktiv}
                onClick={() => beiKategorie(k)}
                className={`${styles.filterChip} ${aktiv ? styles.filterChipAktiv : ''}`}
              >
                {kategorieLabel(k)}
              </button>
            );
          })}
        </nav>

        <div className={styles.suchfeldWrap}>
          <Search className={styles.suchIcon} size={16} aria-hidden="true" />
          <label htmlFor={suchId} className="sr-only">
            {t('suche.label')}
          </label>
          <input
            id={suchId}
            type="search"
            value={suche}
            onChange={(e) => beiSuche(e.target.value)}
            placeholder={t('suche.platzhalter')}
            className={styles.suchfeld}
          />
        </div>
      </div>

      <div className={styles.raster}>
        <div className={styles.liste} aria-live="polite" aria-busy={laedt}>
          {meldungen.length > 0 ? (
            meldungen.map((meldung) => (
              <Link
                key={meldung.id}
                href={`/${locale}/presse/${meldung.slug}`}
                className={styles.karte}
              >
                <div className={styles.karteKopf}>
                  <span className={styles.badge}>
                    {kategorieLabel(meldung.category as KategorieFilter)}
                  </span>
                  {meldung.publishedAt && (
                    <span className={styles.datum}>
                      <Calendar size={12} aria-hidden="true" />
                      {datumsFormat.format(new Date(meldung.publishedAt))}
                    </span>
                  )}
                </div>

                <h2 className={styles.karteTitel}>{meldung.title}</h2>
                {meldung.subtitle && <p className={styles.karteUnterzeile}>{meldung.subtitle}</p>}
                {meldung.summary && <p className={styles.karteText}>{meldung.summary}</p>}

                <span className={styles.weiterlesen}>
                  {t('artikel.lesen')}
                  <ArrowRight className={styles.weiterlesenPfeil} size={16} aria-hidden="true" />
                </span>
              </Link>
            ))
          ) : (
            <div className={styles.leer}>
              <Search className={styles.leerIcon} size={48} aria-hidden="true" />
              <h2 className={styles.leerTitel}>{t('leer.titel')}</h2>
              <p className={styles.leerText}>{t('leer.text')}</p>
            </div>
          )}
        </div>

        {sidebar}
      </div>
    </>
  );
}
