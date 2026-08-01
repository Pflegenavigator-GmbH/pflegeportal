import { getTranslations } from 'next-intl/server';

import { CookieEinstellungenButton } from '@/src/components/legal/CookieEinstellungenButton';

// 🪄 Relativer Import aus dem zentralen Styles-Ordner
import styles from '../../styles/layout.module.css';

interface AppFooterChromeProps {
  locale: string;
}

export default async function AppFooterChrome({ locale }: AppFooterChromeProps) {
  // 🪄 Sicherer Server-Aufruf: Nur die Datei 'common' als Namespace laden
  const t = await getTranslations('common');

  return (
    <footer className={styles.footerChrome}>
      <div className={styles.footerContainer}>
        <div>
          {/* Pfad explizit ab 'footer' angeben */}
          {t('footer.copyright')}
        </div>
        <div className={styles.footerLinks}>
          <a href={`/${locale}/impressum`} className={styles.footerLink}>
            {t('footer.links.impressum')}
          </a>
          <a href={`/${locale}/datenschutz`} className={styles.footerLink}>
            {t('footer.links.datenschutz')}
          </a>
          <a href={`/${locale}/agb`} className={styles.footerLink}>
            {t('footer.links.agb')}
          </a>
          {/* Widerruf der Einwilligung — muss so erreichbar sein wie die
              Erteilung (Art. 7 Abs. 3 DSGVO). */}
          <CookieEinstellungenButton className={styles.footerLink}>
            {t('footer.links.cookies')}
          </CookieEinstellungenButton>
        </div>
      </div>
    </footer>
  );
}
