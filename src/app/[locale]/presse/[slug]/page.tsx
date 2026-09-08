// src/app/[locale]/presse/[slug]/page.tsx
import { ArrowLeft, Calendar } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { isValidLocale } from '@/src/i18n/config';
import { ladeMeldung, ladeVeroeffentlichteSlugs } from '@/src/lib/presse/queries';
import styles from '@/src/styles/presse.module.css';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// ISR-Baseline (siehe Listenseite); Sofort-Aktualisierung via /api/revalidate.
export const revalidate = 3600;

/** Veröffentlichte Detailseiten vorab statisch erzeugen (SEO/Performance). */
export async function generateStaticParams() {
  const slugs = await ladeVeroeffentlichteSlugs();
  return slugs.map(({ locale, slug }) => ({ locale, slug }));
}

/** SEO-Metadaten aus seo_meta mit sinnvollen Fallbacks (Titel/Zusammenfassung). */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const meldung = await ladeMeldung(slug, locale);
  if (!meldung) return { title: 'Presse' };

  const titel = meldung.seoMeta?.title ?? meldung.title;
  const beschreibung = meldung.seoMeta?.description ?? meldung.summary ?? undefined;

  return {
    title: titel,
    description: beschreibung,
    openGraph: {
      title: titel,
      description: beschreibung,
      type: 'article',
      locale,
      publishedTime: meldung.publishedAt ?? undefined,
    },
  };
}

export default async function ArtikelPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();

  const t = await getTranslations({ locale, namespace: 'presse' });
  const meldung = await ladeMeldung(slug, locale);

  if (!meldung) notFound();

  const datum = meldung.publishedAt
    ? new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'long', year: 'numeric' }).format(
        new Date(meldung.publishedAt)
      )
    : null;

  const kategorieLabel = t(`kategorie.${meldung.category}`);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <article className={styles.artikel}>
          <div className={styles.artikelMeta}>
            <span className={styles.badge}>{kategorieLabel}</span>
            {datum && (
              <span className={styles.datum}>
                <Calendar size={14} aria-hidden="true" />
                <time dateTime={meldung.publishedAt ?? undefined}>{datum}</time>
              </span>
            )}
          </div>

          <h1 className={styles.artikelTitel}>{meldung.title}</h1>
          {meldung.subtitle && <p className={styles.artikelUnterzeile}>{meldung.subtitle}</p>}

          {meldung.summary && <p className={styles.artikelLead}>{meldung.summary}</p>}

          {/* Redaktioneller Langtext. content_html stammt ausschließlich aus dem
              Supabase-Dashboard (RLS lässt öffentlich nur SELECT auf published
              zu — kein öffentliches Schreiben). Vertrauensgrenze: gepflegt von
              der Redaktion. Bei künftiger Delegation von Editor-Rechten sollte
              serverseitig sanitisiert werden (siehe README). */}
          {meldung.contentHtml && (
            <div
              className={styles.prosa}
              dangerouslySetInnerHTML={{ __html: meldung.contentHtml }}
            />
          )}
        </article>

        <footer className={styles.fuss}>
          <Link href={`/${locale}/presse`} className={styles.zurueckLink}>
            <ArrowLeft size={16} aria-hidden="true" /> {t('zurueckListe')}
          </Link>
        </footer>
      </div>
    </main>
  );
}
