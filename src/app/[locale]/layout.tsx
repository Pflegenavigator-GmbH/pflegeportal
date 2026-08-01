import type { Viewport } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Toaster } from 'sonner';

import '../globals.css';
import '../i18n.css';

import { AccessibilityMenu } from '@/src/components/a11y/AccessibilityMenu';
import AvatarStage from '@/src/components/Avatar/AvatarStage';
import BetaBanner from '@/src/components/BetaBanner';
import { CookieBanner } from '@/src/components/legal/CookieBanner';
import AppFooterChrome from '@/src/components/navigation/AppFooterChrome';
import AppHeaderChrome from '@/src/components/navigation/AppHeaderChrome';
import { isValidLocale } from '@/src/i18n/config';
import { isRTL } from '@/src/i18n/rtl';
import { A11Y_INIT_SCRIPT } from '@/src/lib/a11y';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a1c3a',
};

function maskKey(key: string | undefined): string {
  if (!key) return '❌ FEHLT';
  if (key.length <= 8) return '⚠️ KURZ';
  return `${key.substring(0, 5)}...${key.substring(key.length - 4)}`;
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('\n====== 🔍 PFLEGENAVIGATOR CONFIG DIAGNOSTICS (2026) ======');
    console.log(`📍 Environment:     ${process.env.ENVIRONMENT || 'development'}`);
    console.log(`🔓 DB Public Key:   ${maskKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)}`);
    console.log(`🔐 DB Secret Key:   ${maskKey(process.env.SUPABASE_SERVICE_ROLE_KEY)}`);
    console.log(`💳 Stripe Secret:   ${maskKey(process.env.STRIPE_SECRET_KEY)}`);
    console.log('===========================================================\n');
  }

  const messages = await getMessages();
  const dir = isRTL(locale) ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={dir}
      className="h-full scroll-smooth"
      // Default-Werte serverseitig rendern → Standardfall matcht exakt.
      // Das Init-Script überschreibt nur bei abweichender Nutzerwahl;
      // suppressHydrationWarning ist das Sicherheitsnetz für diese Fälle.
      data-font-size="normal"
      data-contrast="normal"
      data-motion="system"
      suppressHydrationWarning
    >
      <body className="antialiased bg-[#0a1c3a] text-white min-h-screen flex flex-col font-sans">
        {/* No-FOUC: setzt die A11y-Attribute vor dem ersten Paint */}
        <script dangerouslySetInnerHTML={{ __html: A11Y_INIT_SCRIPT }} />
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Toaster closeButton richColors position="top-right" />
          <BetaBanner />

          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:text-[#0a1c3a] focus:px-4 focus:py-2 focus:rounded-lg focus:ring-2 focus:ring-[#4a90e2]"
          >
            Zum Inhalt springen
          </a>

          <AppHeaderChrome locale={locale} />

          <main id="main-content" className="flex-grow flex flex-col">
            {children}
          </main>

          <AppFooterChrome locale={locale} />
          <AccessibilityMenu />
        </NextIntlClientProvider>
        <CookieBanner />

        <AvatarStage />
      </body>
    </html>
  );
}
