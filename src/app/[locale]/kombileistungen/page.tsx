// src/app/[locale]/kombileistungen/page.tsx
'use client';

import { Calculator, ArrowLeft, ArrowRight, Info } from 'lucide-react';
import Link from 'next/link';
import { useState, use } from 'react';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui';

const pflegegrade = [
  { pg: 2, pflegegeld: 332, sachleistung: 761, bezeichnung: 'Pflegegrad 2' },
  { pg: 3, pflegegeld: 573, sachleistung: 1432, bezeichnung: 'Pflegegrad 3' },
  { pg: 4, pflegegeld: 765, sachleistung: 1778, bezeichnung: 'Pflegegrad 4' },
  { pg: 5, pflegegeld: 947, sachleistung: 2200, bezeichnung: 'Pflegegrad 5' },
];

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function KombiRechnerPage(props: PageProps) {
  const params = use(props.params);
  const locale = params?.locale || 'de';

  const [selectedPG, setSelectedPG] = useState(3);
  const [sachleistungNutzung, setSachleistungNutzung] = useState(60); // In Prozent (z.B. 60% Pflegedienst)

  const aktuellerGrad = pflegegrade.find((p) => p.pg === selectedPG) || pflegegrade[1];

  // Gesetzliche Kombinationspflege-Formel nach § 38 SGB XI
  const verbleibendesPflegegeldProzent = Math.max(0, 100 - sachleistungNutzung);
  const ausgezahltesPflegegeld = aktuellerGrad.pflegegeld * (verbleibendesPflegegeldProzent / 100);
  const genutzteSachleistungWert = aktuellerGrad.sachleistung * (sachleistungNutzung / 100);
  const gesamtwertLeistungen = ausgezahltesPflegegeld + genutzteSachleistungWert;

  return (
    <main className="min-h-screen bg-slate-900 text-white font-sans py-12 px-4">
      <div className="container mx-auto max-w-4xl space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#0f2744] to-[#20b2aa] border border-white/10 rounded-2xl shadow-xl">
            <Calculator className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Kombinationspflege-Rechner (§ 38 SGB XI)
          </h1>
          <p className="text-sm text-gray-400 max-w-xl mx-auto">
            Nutzen Sie einen Pflegedienst und pflegen gleichzeitig selbst? Berechnen Sie hier Ihr
            restliches Pflegegeld.
          </p>
        </div>

        {/* Gesetzlicher Wegweiser in einfacher Sprache */}
        <Card className="bg-blue-500/10 border-blue-500/20 text-white shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <CardTitle className="text-sm font-bold text-blue-400">
                  Wie wird gerechnet? (Einfach erklärt)
                </CardTitle>
                <CardDescription className="text-gray-300 text-xs sm:text-sm mt-1 leading-relaxed">
                  Je mehr Geld der <strong>Pflegedienst</strong> verbraucht, desto weniger{' '}
                  <strong>Pflegegeld</strong> wird auf Ihr Konto überwiesen. Wenn der Pflegedienst
                  z.B. genau 60% seines Budgets ausschöpft, zahlt Ihnen die Pflegekasse die
                  restlichen 40% als Pflegegeld aus.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 1. Pflegegrad wählen */}
        <Card className="bg-white/5 border-white/10 text-white shadow-xl">
          <CardContent className="pt-6">
            <label className="text-sm font-bold text-gray-300 block mb-3">
              1. Wählen Sie den Pflegegrad:
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {pflegegrade.map((pg) => (
                <button
                  key={pg.pg}
                  onClick={() => setSelectedPG(pg.pg)}
                  className={`p-4 rounded-xl border-2 transition-all text-center flex flex-col items-center ${
                    selectedPG === pg.pg
                      ? 'border-[#20b2aa] bg-[#20b2aa]/10 text-white'
                      : 'border-white/10 text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <span className="text-xl font-bold">{pg.pg}</span>
                  <span className="text-xs opacity-60 mt-1">
                    Geld: {pg.pflegegeld}€ | Sach: {pg.sachleistung}€
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 2. Interaktiver Schieberegler für Seniorinnen & Senioren */}
        <Card className="bg-white/5 border-white/10 text-white shadow-xl">
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-gray-300">
                2. Wie viel Prozent nutzt der Pflegedienst?
              </label>
              <span className="text-xl font-mono font-bold text-[#20b2aa]">
                {sachleistungNutzung}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={sachleistungNutzung}
              onChange={(e) => setSachleistungNutzung(Number(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[#20b2aa]"
            />

            <div className="flex justify-between text-xs text-gray-500 font-mono">
              <span>0% (Nur Angehörige)</span>
              <span>50% (Halbe-Halbe)</span>
              <span>100% (Vollständig Pflegedienst)</span>
            </div>
          </CardContent>
        </Card>

        {/* 3. Das echte, transparente Rechen-Ergebnis */}
        <Card className="bg-slate-950 border border-white/10 shadow-2xl overflow-hidden">
          <div className="p-6 bg-white/[0.02] border-b border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4 text-center md:text-left">
            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl">
              <span className="text-xs text-gray-400 block mb-1">
                Wert der Sachleistungen (Pflegedienst)
              </span>
              <span className="text-2xl font-bold text-white">
                {genutzteSachleistungWert.toFixed(2)} €
              </span>
              <span className="text-[10px] text-gray-500 block mt-0.5">
                ({sachleistungNutzung}% von max. {aktuellerGrad.sachleistung}€)
              </span>
            </div>
            <div className="p-4 bg-[#20b2aa]/5 border border-[#20b2aa]/20 rounded-xl">
              <span className="text-xs text-emerald-400 block mb-1">
                Ihr verbleibendes Pflegegeld (Konto-Überweisung)
              </span>
              <span className="text-2xl font-bold text-[#20b2aa]">
                {ausgezahltesPflegegeld.toFixed(2)} €
              </span>
              <span className="text-[10px] text-gray-500 block mt-0.5">
                ({verbleibendesPflegegeldProzent}% von max. {aktuellerGrad.pflegegeld}€)
              </span>
            </div>
          </div>
          <CardContent className="p-6 text-center">
            <span className="text-xs text-gray-400">
              Gesamtwert der monatlichen Hilfen durch die Kombination:
            </span>
            <p className="text-4xl font-extrabold text-white mt-1">
              {gesamtwertLeistungen.toFixed(2)} €
            </p>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center border-t border-white/5 pt-4">
          <Link
            href={`/${locale}/pflegegrad/ergebnis`}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Zurück zum Gutachten
          </Link>
          <Link
            href={`/${locale}/briefe`}
            className="inline-flex items-center gap-2 bg-[#20b2aa] hover:bg-[#3ddbd0] text-slate-950 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-colors"
          >
            Brief-Zentrum öffnen <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
