// src/app/[locale]/pflegegrad/ergebnis/_component/HandlungsEmpfehlung.tsx
'use client';

import { CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui';
import { PflegegradErgebnis } from '@/src/types/pflegegrad';

interface HandlungsEmpfehlungenProps {
  ergebnis: PflegegradErgebnis;
}

/**
 * Die Empfehlungen kommen als Schlüssel aus dem Rechner und werden hier
 * übersetzt. Bis zum 16.09.2026 lieferte der Rechner fertige deutsche Sätze;
 * sie standen dadurch auch auf der englischen Seite (#107).
 */
export function HandlungsEmpfehlungen({ ergebnis }: HandlungsEmpfehlungenProps) {
  const t = useTranslations('pflegegrad.ergebnis');

  return (
    <Card className="bg-white/5 border-white/10 text-white shadow-xl">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400" aria-hidden="true" />
          {t('empfehlungenTitel')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <ul className="grid gap-3">
          {ergebnis.recommendations.map((empfehlung) => (
            <li
              key={empfehlung}
              className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl text-sm leading-relaxed text-gray-200"
            >
              <CheckCircle
                className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>{t(`empfehlungen.${empfehlung}`)}</span>
            </li>
          ))}
          {ergebnis.trafficLight === 'gelb' && (
            <li className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm leading-relaxed text-amber-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                <strong>{t('grenzbereichTitel')}</strong> {t('grenzbereichText')}
              </span>
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
