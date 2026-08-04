// src/app/[locale]/presse/page.tsx
import { ArrowLeft, Download, FileText, Mail, Newspaper } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { isValidLocale } from '@/src/i18n/config';
import { ladeMeldungen } from '@/src/lib/presse/queries';
import { SOCIAL_LINKS } from '@/src/lib/social-links';
import styles from '@/src/styles/presse.module.css';

import { PresseClient } from './_components/PresseClient';

interface PageProps {
  params: Promise<{ locale: string }>;
}

// ISR-Baseline: statisch, stündlich neu generiert. Sofortiges Neu-Rendern beim
// Publishing löst /api/revalidate per Supabase-Webhook aus.
export const revalidate = 3600;

export default async function PressePage({ params }: PageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const t = await getTranslations({ locale, namespace: 'presse' });

  // Server-seitiger Erststand (ISR/SEO); die Live-Suche übernimmt der Client.
  const initialMeldungen = await ladeMeldungen({ locale });

  const sidebar = (
    <aside className={styles.sidebar} aria-label={t('kontakt.titel')}>
      <section className={`${styles.seitenkarte} ${styles.seitenkarteDunkel}`}>
        <h2 className={`${styles.seitenTitel} ${styles.seitenTitelDunkel}`}>
          <Mail size={20} aria-hidden="true" /> {t('kontakt.titel')}
        </h2>
        <p className={`${styles.seitenText} ${styles.seitenTextDunkel}`}>
          {t('kontakt.beschreibung')}
        </p>
        <div className={styles.kontaktBlock}>
          <p className={styles.kontaktName}>{t('kontakt.stelle')}</p>
          <p className={styles.kontaktZeile}>presse@pflegenavigatoreu.com</p>
          <p className={styles.kontaktZeile}>+49 (0) 800 123 456</p>
        </div>
        <a href="mailto:presse@pflegenavigatoreu.com" className={styles.aktionPrimaer}>
          {t('kontakt.nachricht')}
        </a>
      </section>

      <section className={styles.seitenkarte}>
        <h2 className={`${styles.seitenTitel} ${styles.seitenTitelHell}`}>
          <Download size={20} aria-hidden="true" /> {t('mediakit.titel')}
        </h2>
        <p className={styles.seitenText}>{t('mediakit.text')}</p>
        <a href="/presse/media-kit.zip" download className={styles.aktionSekundaer}>
          <Download size={16} aria-hidden="true" /> {t('mediakit.logos')}
        </a>
        <a href="/presse/factsheet.pdf" download className={styles.aktionSekundaer}>
          <FileText size={16} aria-hidden="true" /> {t('mediakit.factsheet')}
        </a>
      </section>

      <section className={styles.seitenkarte}>
        <h2 className={`${styles.seitenTitel} ${styles.seitenTitelHell}`}>{t('social.titel')}</h2>
        <ul className={styles.socialListe}>
          {SOCIAL_LINKS.map(({ name, url, icon: Icon }) => (
            <li key={name}>
              <a
                href={url}
                className={styles.socialItem}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('social.folgen', { netzwerk: name })}
              >
                <Icon size={20} className={styles.socialIcon} />
                <span>{name}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.hero}>
          <span className={styles.heroBadge}>
            <Newspaper size={40} aria-hidden="true" />
          </span>
          <h1 className={styles.heroTitel}>{t('hero.titel')}</h1>
          <p className={styles.heroText}>{t('hero.untertitel')}</p>
        </header>

        <PresseClient locale={locale} initialMeldungen={initialMeldungen} sidebar={sidebar} />

        <footer className={styles.fuss}>
          <Link href={`/${locale}`} className={styles.zurueckLink}>
            <ArrowLeft size={16} aria-hidden="true" /> {t('zurueck')}
          </Link>
        </footer>
      </div>
    </main>
  );
}
