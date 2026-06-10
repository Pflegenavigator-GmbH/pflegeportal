// src/app/[locale]/pflegegrad/ergebnis/ModulListe.tsx
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
          const isModul3 = meta.id === 3;
          const gewichtetePunkte = isModul3 ? 0 : ergebnis.weightedScores[meta.id as 1 | 2 | 4 | 5];
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
                {meta.id === 2 && (
                  <p className="text-[11px] text-purple-400 font-medium">
                    ℹ️ Höchstwertprinzip aktiv (Vergleich Modul 2: {ergebnis.moduleScores[2]} Pkt.
                    vs Modul 3: {ergebnis.moduleScores[3]} Pkt.)
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
