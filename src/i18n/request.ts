// src/i18n/request.ts
import { AbstractIntlMessages } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const resolvedLocale = await requestLocale;

  const locale =
      resolvedLocale && routing.locales.includes(resolvedLocale as string)
          ? resolvedLocale
          : routing.defaultLocale;

  try {
    // 🪄 Erweitere das Promise.all um das neue Startseiten-Modul
    const [commonMessages, pflegegradMessages, startseiteMessages] = await Promise.all([
      import(`../../public/locales/${locale}/common.json`).then((m) => m.default),
      import(`../../public/locales/${locale}/pflegegrad.json`).then((m) => m.default).catch(() => ({})),
      import(`../../public/locales/${locale}/startseite.json`).then((m) => m.default).catch(() => ({})),
    ]);

    // Alle Namespaces sauber im Client-Provider mergen
    const combinedMessages = {
      ...commonMessages,
      ...pflegegradMessages,
      ...startseiteMessages,
    };

    return {
      locale,
      messages: combinedMessages as unknown as AbstractIntlMessages,
    };
  } catch (error) {
    console.error(`Kritischer Fehler beim Laden der Locales für: ${locale}`, error);
    const baseModule = await import(`../../public/locales/de/common.json`);
    return {
      locale: 'de',
      messages: baseModule.default as unknown as AbstractIntlMessages,
    };
  }
});