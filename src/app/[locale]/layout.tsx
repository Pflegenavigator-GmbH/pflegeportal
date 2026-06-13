// src/app/[locale]/layout.tsx

import type { Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../globals.css';
import '../i18n.css';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Toaster } from 'sonner';

import BetaBanner from '@/src/components/BetaBanner';
import { CookieBanner } from '@/src/components/legal/CookieBanner';
import AppHeaderChrome from '@/src/components/navigation/AppHeaderChrome';
import { isValidLocale } from '@/src/i18n/config';
import { isRTL } from '@/src/i18n/rtl';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f2744',
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
    <html lang={locale} dir={dir} className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased bg-[#0f2744] text-white min-h-screen flex flex-col">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Toaster closeButton richColors position="top-right" />
          <BetaBanner />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:text-[#0f2744] focus:px-4 focus:py-2 focus:rounded-lg"
          >
            Zum Inhalt springen
          </a>

          {/* ✅ INTEGRATION: Der neue reaktive App-Chrome Header */}
          <AppHeaderChrome locale={locale} />

          <main id="main-content" className="flex-grow">
            {children}
          </main>

          <footer className="bg-[#0f2744] border-t border-white/10 py-8 px-4 mt-auto">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
              <div>© 2026 PflegeNavigator EU gUG • Alle Angaben sind Orientierungshilfen.</div>
              <div className="flex flex-wrap gap-4 md:gap-6 justify-center">
                <a href={`/${locale}/impressum`} className="hover:text-white transition-colors">
                  Impressum
                </a>
                <a href={`/${locale}/datenschutz`} className="hover:text-white transition-colors">
                  Datenschutz
                </a>
                <a href={`/${locale}/agb`} className="hover:text-white transition-colors">
                  AGB
                </a>
              </div>
            </div>
          </footer>
        </NextIntlClientProvider>
        <CookieBanner />
      </body>
    </html>
  );
}
