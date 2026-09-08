// src/app/[locale]/pflegegrad/ergebnis/_component/HandlungsEmpfehlung.tsx
'use client';

import { CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui';
import { PflegegradErgebnis } from '@/src/types/pflegegrad';

interface HandlungsEmpfehlungenProps {
  ergebnis: PflegegradErgebnis;
}

export function HandlungsEmpfehlungen({ ergebnis }: HandlungsEmpfehlungenProps) {
  return (
    <Card className="bg-white/5 border-white/10 text-white shadow-xl">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          Strategische Handlungsempfehlungen
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <ul className="grid gap-3">
          {ergebnis.recommendations.map((empfehlung, index) => (
            <li
              key={index}
              className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl text-sm leading-relaxed text-gray-200"
            >
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{empfehlung}</span>
            </li>
          ))}
          {ergebnis.trafficLight === 'gelb' && (
            <li className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm leading-relaxed text-amber-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Grenzbereich-Warnung:</strong> Ihr Ergebnis liegt haarscharf an der Grenze.
                Legen Sie dem Antrag ein detailliertes Pflegetagebuch bei, um Streichungen durch den
                Gutachter proaktiv abzuwehren.
              </span>
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
