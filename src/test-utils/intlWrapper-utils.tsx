// src/test-utils/initWrapper-utils.txw
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import React from 'react';

// Importiere deine Mock-Messages für Tests
const messages = {
  common: {
    welcome: 'Willkommen',
  },
};

export function renderWithIntl(ui: React.ReactElement, locale = 'de') {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}
