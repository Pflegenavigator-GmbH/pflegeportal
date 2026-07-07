// src/app/[locale]/pflegegrad/ergebnis/_component/ModulListe.tsx
'use client';

import { useRouter } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
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

export function ModulListe({ metadata, ergebnis, locale }: ModulListeProps) {
  const router = useRouter();

  const handleModulClick = (modulId: number) => {
    // Navigiert direkt in das spezifische Modul zur Nachbesserung
    router.push(`/${locale}/pflegegrad/modul${modulId}`);
  };

  return (
    <Card className="bg-white/5 border-white/10 text-white shadow-xl">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Gewichtete Modul-Einzelwerte</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-4">
        {metadata.map((meta) => {
          const isValidWeightedModule = meta.id >= 1 && meta.id <= 5;
          let gewichtetePunkte = 0;
          let showHoechstwertInfo = false;

          if (isValidWeightedModule) {
            gewichtetePunkte = ergebnis.weightedScores[meta.id as 1 | 2 | 3 | 4 | 5];

            if (meta.id === 2 || meta.id === 3) {
              const maxRohpunkte = Math.max(ergebnis.moduleScores[2], ergebnis.moduleScores[3]);
              if (ergebnis.moduleScores[meta.id as 2 | 3] < maxRohpunkte) {
                gewichtetePunkte = 0;
              }
              showHoechstwertInfo = true;
            }
          }

          const rohpunkte = ergebnis.moduleScores[meta.id as 1 | 2 | 3 | 4 | 5 | 6];

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
                {showHoechstwertInfo && (
                  <p className="text-[11px] text-purple-400 font-medium mt-1">
                    ℹ️ Höchstwertprinzip aktiv (Vergleich Modul 2: {ergebnis.moduleScores[2]} Pkt.
                    vs Modul 3: {ergebnis.moduleScores[3]} Pkt.)
                    {gewichtetePunkte === 0
                      ? ' -> Fließt nicht in die Gesamtwertung ein.'
                      : ' -> Höherer Wert zählt.'}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0 space-y-0.5">
                <p className="text-xl font-bold text-white group-hover:text-[#3ddbd0] transition-colors">
                  {meta.id === 6 ? 'Erfasst' : `${gewichtetePunkte.toFixed(1)} Pkt.`}
                </p>
                <p className="text-xs text-gray-500">Rohwert: {rohpunkte}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
