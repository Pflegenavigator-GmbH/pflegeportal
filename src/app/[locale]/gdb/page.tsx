// src/app/[locale]/gdb/page.tsx
'use client';

import { AlertTriangle, ArrowLeft, Building2, FileText, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { use } from 'react';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui';

interface PageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Der GdB-Rechner ist abgeschaltet (Issue #131).
 *
 * Bis zum 16.09.2026 stand hier ein dreistufiger Rechner, der die Einzelwerte
 * addierte und das Ergebnis mit einer Vergünstigungsliste ausspielte. Die
 * Versorgungsmedizinischen Grundsätze schließen Addition und Mittelwertbildung
 * ausdrücklich aus (Anlage zu § 2 VersMedV, Teil A Nr. 3.2).
 *
 * Statt eines nackten 404 erklärt die Seite, warum die Zahl weg ist, und nennt
 * die Stellen, die verbindlich Auskunft geben. Der Rechner-Code bleibt im
 * Repository, bis über die Gesamtschau entschieden ist (#26); erreichbar ist
 * er nicht mehr.
 */
export default function GdBAbgeschaltetPage(props: PageProps) {
  const router = useRouter();
  const params = use(props.params);
  const locale = params?.locale || 'de';

  const t = useTranslations('gdb');

  return (
    <main className="min-h-screen bg-slate-900 text-white py-12 px-4 font-sans">
      <div className="container mx-auto max-w-2xl space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-3">
            <AlertTriangle className="w-7 h-7 text-amber-400" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t('titel')}</h1>
          <p className="text-base text-gray-300 mt-1">{t('untertitel')}</p>
        </div>

        <Card className="bg-white/5 border-white/10 text-white shadow-xl">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-lg font-bold text-white">{t('warumTitel')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4 text-base text-gray-200 leading-relaxed">
            <p>{t('warumText')}</p>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              {t('warumHinweis')}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 text-white shadow-xl">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-lg font-bold text-white">{t('wohinTitel')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-5 text-base text-gray-200 leading-relaxed">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 mt-1 shrink-0 text-[#20b2aa]" aria-hidden="true" />
              <div>
                <h2 className="font-bold text-white mb-1">{t('amtTitel')}</h2>
                <p>{t('amtText')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 mt-1 shrink-0 text-[#20b2aa]" aria-hidden="true" />
              <div>
                <h2 className="font-bold text-white mb-1">{t('verbandTitel')}</h2>
                <p>{t('verbandText')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 mt-1 shrink-0 text-[#20b2aa]" aria-hidden="true" />
              <div>
                <h2 className="font-bold text-white mb-1">{t('antragTitel')}</h2>
                <p>{t('antragText')}</p>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/${locale}/briefe`)}
                  className="mt-3 min-h-12 border-white/10 text-white hover:bg-white/5"
                >
                  {t('antragLink')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-gray-400 text-center">{t('stand')}</p>

        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}`)}
          className="w-full min-h-12 border-white/10 text-white hover:bg-white/5"
        >
          <ArrowLeft className="mr-2 w-4 h-4" aria-hidden="true" /> {t('zurueck')}
        </Button>
      </div>
    </main>
  );
}
