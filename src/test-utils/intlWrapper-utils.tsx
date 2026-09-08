// src/test-utils/intlWrapper-utils.tsx
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import React from 'react';

import type { Locale } from '@/src/i18n/config';

/**
 * Rendert eine Komponente mit next-intl-Kontext.
 *
 * Die echten deutschen Nachrichten statt einer Handvoll Attrappen: Seit der
 * Typisierung über `AppConfig` muss das Objekt zur Nachrichtenstruktur passen,
 * und ein Test mit erfundenen Schlüsseln würde ohnehin nichts über die
 * Anwendung aussagen.
 */
import common from '../../public/locales/de/common.json';
import pflegegrad from '../../public/locales/de/pflegegrad.json';
import philosophie from '../../public/locales/de/philosophie.json';
import presse from '../../public/locales/de/presse.json';
import startseite from '../../public/locales/de/startseite.json';

const messages = { common, startseite, pflegegrad, philosophie, presse };

export function renderWithIntl(ui: React.ReactElement, locale: Locale = 'de') {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}
