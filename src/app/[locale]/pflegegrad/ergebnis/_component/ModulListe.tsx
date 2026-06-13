// src/app/[locale]/pflegegrad/ergebnis/_component/ModulListe.tsx
'use client';

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
}

export function ModulListe({ metadata, ergebnis }: ModulListeProps) {
  return (
    <Card className="bg-white/5 border-white/10 text-white shadow-xl">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Gewichtete Modul-Einzelwerte</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-4">
        {metadata.map((meta) => {
          // Sicheres Mapping für die TypeScript-Typen (1-5 haben gewichtete Punkte, 6 nicht)
          const isValidWeightedModule = meta.id >= 1 && meta.id <= 5;

          // Höchstwertprinzip: Wenn Modul 3 < Modul 2 ist, fließt Modul 3 mit 0 in die Wertung ein (und vice versa)
          let gewichtetePunkte = 0;
          let showHoechstwertInfo = false;

          if (isValidWeightedModule) {
            gewichtetePunkte = ergebnis.weightedScores[meta.id as 1 | 2 | 3 | 4 | 5];

            // Wenn es Modul 2 oder 3 ist, prüfen wir, ob es der "Verlierer" des Höchstwertprinzips ist
            if (meta.id === 2 || meta.id === 3) {
              const maxRohpunkte = Math.max(ergebnis.moduleScores[2], ergebnis.moduleScores[3]);
              if (ergebnis.moduleScores[meta.id as 2 | 3] < maxRohpunkte) {
                gewichtetePunkte = 0; // Dieser Wert zählt nicht fürs Gesamtergebnis
              }
              showHoechstwertInfo = true; // Info bei beiden Modulen anzeigen
            }
          }

          const rohpunkte = ergebnis.moduleScores[meta.id as 1 | 2 | 3 | 4 | 5 | 6];

          return (
            <div
              key={meta.id}
              className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <p className="font-semibold text-white flex items-center gap-2">
                  <span className="text-xs font-mono bg-white/5 border border-white/10 w-5 h-5 rounded flex items-center justify-center text-gray-400">
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
                <p className="text-xl font-bold text-white">
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
