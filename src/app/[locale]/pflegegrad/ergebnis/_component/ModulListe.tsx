// src/app/[locale]/pflegegrad/ergebnis/_component/ModulListe.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui';
import {
  KRITERIEN_GESAMT,
  MODULE_KRITERIEN,
  MODULE_MAX_RAW,
  MODULE_WEIGHTS,
  severityStufe,
  weightedModulePoints,
  type AdultModuleNumber,
} from '@/src/lib/pflegegrad/nba';
import { PflegegradErgebnis } from '@/src/types/pflegegrad';

interface NBAData {
  id: number;
  name: string;
  beschreibung: string;
}

interface ModulListeProps {
  metadata: NBAData[];
  ergebnis: PflegegradErgebnis;
  locale: string;
}

/** Höchste Stufe der Näherung — als Zahl im Text, nicht als Punktwert. */
const STUFEN_MAX = 4;

/**
 * Modulwerte der Begutachtung — als das dargestellt, was sie sind (Issue #137).
 *
 * Bis zum 16.09.2026 stand hier je Modul „12.0 Pkt." neben „Rohwert: 8". Beide
 * Zahlen lasen sich wie die amtliche Punktzahl aus der Begutachtung, obwohl der
 * Fragebogen nur einen Teil der Kriterien erhebt (28 von 64) und die Stufe über
 * den ANTEIL der erreichten Rohpunkte schätzt. Die amtlichen Punktschwellen sind
 * auf Modulebene nicht anwendbar.
 *
 * Deshalb steht jetzt die geschätzte Stufe vorn, daneben die erhobenen
 * Kriterien, und die Rohpunkte sind ausdrücklich als Fragebogenpunkte benannt.
 * Die fachliche Prüfung der Näherung selbst ist #112.
 */
export function ModulListe({ metadata, ergebnis, locale }: ModulListeProps) {
  const router = useRouter();
  const t = useTranslations('pflegegrad.ergebnis.modulListe');

  const zahl = (wert: number) => wert.toLocaleString(locale, { maximumFractionDigits: 1 });

  const handleModulClick = (modulId: number) => {
    // Navigiert direkt in das spezifische Modul zur Nachbesserung
    router.push(`/${locale}/pflegegrad/modul${modulId}`);
  };

  return (
    <Card className="bg-white/5 border-white/10 text-white shadow-xl">
      <CardHeader>
        <CardTitle className="text-lg font-bold">{t('titel')}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-4">
        <p className="text-xs text-gray-300 leading-relaxed bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          {t('hinweis', {
            erhoben: KRITERIEN_GESAMT.erhoben,
            amtlich: KRITERIEN_GESAMT.amtlich,
            stufen: STUFEN_MAX,
          })}
        </p>

        {metadata.map((meta) => {
          const modulId = meta.id as AdultModuleNumber;
          const kriterien = MODULE_KRITERIEN[modulId];
          const rohpunkte = ergebnis.moduleScores[modulId];
          const maxRohpunkte = MODULE_MAX_RAW[modulId];

          // Modul 6 zählt mit 15 % in die Gesamtwertung (siehe `rechner.ts`),
          // steht aber nicht in `weightedScores` — dort liegen nur die Module 1
          // bis 5. Deshalb hier nachrechnen statt es als „nicht gewertet"
          // auszugeben, wie es die Anzeige bis zum 16.09.2026 nahelegte.
          let gewichtetePunkte =
            modulId === 6
              ? weightedModulePoints(6, rohpunkte)
              : ergebnis.weightedScores[modulId as 1 | 2 | 3 | 4 | 5];
          let stufe = severityStufe(rohpunkte, maxRohpunkte);

          // Höchstwertprinzip: Von Modul 2 und 3 zählt nur der höhere Wert.
          //
          // Verglichen werden die GEWICHTETEN Werte — so rechnet auch
          // `calculatePflegegrad`. Die Anzeige verglich bis zum 16.09.2026 die
          // Rohwerte; weil Modul 2 aus 15 und Modul 3 aus 12 möglichen
          // Rohpunkten besteht, konnte sie ein anderes Modul als zählend
          // ausweisen als die Berechnung. Bei Gleichstand zählt der Wert nur
          // einmal, angezeigt an Modul 2.
          const istHoechstwertModul = modulId === 2 || modulId === 3;
          const hoechsterGewichteter = Math.max(
            ergebnis.weightedScores[2],
            ergebnis.weightedScores[3]
          );
          const gleichstand = ergebnis.weightedScores[2] === ergebnis.weightedScores[3];
          const verdraengt =
            istHoechstwertModul &&
            (gewichtetePunkte < hoechsterGewichteter || (gleichstand && modulId === 3));

          if (verdraengt) {
            gewichtetePunkte = 0;
            stufe = 0;
          }

          return (
            <div
              key={meta.id}
              onClick={() => handleModulClick(meta.id)}
              className="p-4 bg-white/[0.02] hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl flex items-start justify-between gap-4 cursor-pointer transition-all duration-200 select-none group"
            >
              <div className="space-y-1">
                <p className="font-semibold text-white flex items-center gap-2 group-hover:text-[#20b2aa] transition-colors">
                  <span className="text-xs font-mono bg-white/5 border border-white/10 w-5 h-5 rounded flex items-center justify-center text-gray-400 group-hover:border-[#20b2aa]/40">
                    {meta.id}
                  </span>
                  {meta.name}
                </p>
                <p className="text-xs text-gray-400 max-w-xl leading-relaxed">
                  {meta.beschreibung}
                </p>
                <p className="text-xs text-amber-300/90">
                  {t('kriterien', { erhoben: kriterien.erhoben, amtlich: kriterien.amtlich })}
                </p>
                {istHoechstwertModul && (
                  <p className="text-[11px] text-purple-400 font-medium mt-1">
                    {t(verdraengt ? 'hoechstwertZaehltNicht' : 'hoechstwertZaehlt')}
                  </p>
                )}
              </div>

              <div className="text-right flex-shrink-0 space-y-0.5">
                <p className="text-base font-bold text-white group-hover:text-[#3ddbd0] transition-colors">
                  {t('stufe', { stufe, maximum: STUFEN_MAX })}
                </p>
                <p className="text-xs text-gray-400">
                  {t('gewichtung', {
                    punkte: zahl(gewichtetePunkte),
                    gewicht: MODULE_WEIGHTS[modulId],
                  })}
                </p>
                <p className="text-xs text-gray-500">
                  {t('rohwert', { roh: rohpunkte, maximum: maxRohpunkte })}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
