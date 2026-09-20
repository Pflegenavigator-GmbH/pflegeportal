// src/app/[locale]/datenschutz/auskunft/page.tsx
'use client';

import { ArrowLeft, Clock, FileText, Mail, ShieldAlert, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { use } from 'react';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui';
import { KONTAKT_EMAIL } from '@/src/lib/kontakt';

interface PageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Auskunft nach Art. 15 DSGVO — Antrag per E-Mail.
 *
 * Bis zum 14.09.2026 stand hier ein Formular, das Anträge an `/api/feedback`
 * schickte. Die Route speicherte nichts und leitete nichts weiter; die Seite
 * meldete trotzdem „revisionssicher eingegangen" (Issue #146). Solange es keine
 * Selbstbedienung aus der Sitzung gibt (#146 Stufe 2), nennt die Seite nur den
 * Weg, der tatsächlich bei einer Person ankommt — und bestätigt nichts selbst.
 */
export default function DatenauskunftPage(props: PageProps) {
  const router = useRouter();
  const params = use(props.params);
  const locale = params?.locale || 'de';

  const t = useTranslations('rechtliches.auskunft');
  // Nur der Betreff steht in der Adresse — nie der Fallcode.
  const mailto = `mailto:${KONTAKT_EMAIL}?subject=${encodeURIComponent(t('mailBetreff'))}`;

  return (
    <main className="min-h-screen bg-slate-900 text-white py-12 px-4 font-sans">
      <div className="container mx-auto max-w-2xl space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-3">
            <FileText className="w-7 h-7 text-blue-400" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t('titel')}</h1>
          <p className="text-base text-gray-300 mt-1">{t('untertitel')}</p>
        </div>

        <Card className="bg-white/5 border-white/10 text-white shadow-xl">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-lg font-bold text-white">{t('hinweisTitel')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-5 text-base text-gray-200 leading-relaxed">
            <p>{t('hinweisText')}</p>

            <div>
              <h2 className="font-bold text-white mb-2">{t('wegTitel')}</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>{t('schritt1')}</li>
                <li>{t('schritt2')}</li>
                <li>{t('schritt3')}</li>
              </ol>
            </div>

            <a
              href={mailto}
              className="flex items-center justify-center gap-2 min-h-14 w-full rounded-xl bg-[#20b2aa] px-5 py-3 text-lg font-bold text-slate-950 hover:bg-[#3ddbd0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Mail className="w-5 h-5" aria-hidden="true" />
              {t('mailLink')}
            </a>
            <p className="text-center font-mono text-base text-white">{KONTAKT_EMAIL}</p>

            <p className="flex items-start gap-2">
              <Clock className="w-5 h-5 mt-0.5 shrink-0 text-[#20b2aa]" aria-hidden="true" />
              <span>{t('frist')}</span>
            </p>
          </CardContent>
        </Card>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" aria-hidden="true" />
          <div className="text-base leading-relaxed text-gray-200">
            <strong className="block text-white">{t('sicherheitTitel')}</strong>
            {t('sicherheitText')}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/datenschutz`)}
            className="flex-1 min-h-12 border-white/10 text-white hover:bg-white/5"
          >
            <ArrowLeft className="mr-2 w-4 h-4" aria-hidden="true" /> {t('zurueck')}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/datenschutz/loeschen`)}
            className="flex-1 min-h-12 border-white/10 text-white hover:bg-white/5"
          >
            <Trash2 className="mr-2 w-4 h-4" aria-hidden="true" /> {t('loeschenLink')}
          </Button>
        </div>
      </div>
    </main>
  );
}
