// src/app/[locale]/kombileistungen/page.tsx
'use client';

import {
  Calculator,
  ArrowRight,
  ArrowLeft,
  Check,
  Euro,
  Home,
  Clock,
  Users,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, use } from 'react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/src/components/ui/card';

// Falls du die Konstanten in einer eigenen Datei hast, kannst du sie importieren.
// Für dieses Modul habe ich die Werte für 2026 der Einfachheit halber integriert.
interface KombiOption {
  name: string;
  beschreibung: string;
  prozent: number;
  emoji: string;
}

const pflegegeldOptionen: KombiOption[] = [
  { name: 'Pflegegeld', beschreibung: 'Auszahlung für Angehörige', prozent: 100, emoji: '💶' },
  { name: 'Sachleistungen', beschreibung: 'Ambulanter Pflegedienst', prozent: 50, emoji: '🏥' },
  { name: 'Tagespflege', beschreibung: 'Tagsüber teilstationär', prozent: 50, emoji: '☀️' },
  { name: 'Kurzzeitpflege', beschreibung: 'Temporäre Vollzeitpflege', prozent: 50, emoji: '⏱️' },
  { name: 'Verhinderungspflege', beschreibung: 'Urlaubsvertretung', prozent: 50, emoji: '🌴' },
  { name: 'Nachtpflege', beschreibung: 'Nachts teilstationär', prozent: 25, emoji: '🌙' },
];

const pflegegrade = [
  { pg: 2, bezeichnung: 'Pflegegrad 2', basis: 332 },
  { pg: 3, bezeichnung: 'Pflegegrad 3', basis: 573 },
  { pg: 4, bezeichnung: 'Pflegegrad 4', basis: 765 },
  { pg: 5, bezeichnung: 'Pflegegrad 5', basis: 947 },
];

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function KombiRechnerPage(props: PageProps) {
  useRouter();
  const params = use(props.params);
  const locale = params?.locale || 'de';

  const [selectedPG, setSelectedPG] = useState(3);
  const [gewaehlteOptionen, setGewaehlteOptionen] = useState<string[]>(['Pflegegeld']);
  const [showInfo, setShowInfo] = useState(true);

  const basisBetrag = pflegegrade.find((p) => p.pg === selectedPG)?.basis || 573;
  // Hinweis: Maximalbetrag in diesem Layout als statischer Puffer
  // (In einer echten DiPA sollte dieser ans SGB XI der jeweiligen Stufe gekoppelt sein)
  const maxBetrag = 1848;

  const berechneSumme = () => {
    let summe = 0;
    gewaehlteOptionen.forEach((optionName) => {
      const option = pflegegeldOptionen.find((o) => o.name === optionName);
      if (option) {
        summe += basisBetrag * (option.prozent / 100);
      }
    });
    return summe;
  };

  const aktuelleSumme = berechneSumme();
  const restBudget = Math.max(0, maxBetrag - aktuelleSumme);
  const ueberschritten = aktuelleSumme > maxBetrag;

  const toggleOption = (name: string) => {
    if (gewaehlteOptionen.includes(name)) {
      // Pflegegeld muss immer als Minimum bestehen bleiben
      if (gewaehlteOptionen.length > 1) {
        setGewaehlteOptionen(gewaehlteOptionen.filter((o) => o !== name));
      }
    } else {
      setGewaehlteOptionen([...gewaehlteOptionen, name]);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white font-sans py-12 px-4">
      <div className="container mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 mb-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#0f2744] to-[#20b2aa] border border-white/10 rounded-2xl shadow-xl">
            <Calculator className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Kombinations-Rechner § 38
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto">
            Pflegegeld und Pflegesachleistungen clever prozentual kombinieren
          </p>
        </div>

        {/* Info-Box (einmalig) */}
        {showInfo && (
          <Card className="bg-amber-500/10 border-amber-500/20 text-white shadow-xl relative">
            <button
              onClick={() => setShowInfo(false)}
              className="absolute top-4 right-4 text-amber-500 hover:text-amber-400 transition-colors"
            >
              ✕
            </button>
            <CardHeader className="pb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <CardTitle className="text-base font-bold text-amber-400">
                    Das Prinzip der Kombinationsleistung
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-xs sm:text-sm mt-1.5 leading-relaxed">
                    Ab Pflegegrad 2 können Sie Pflegegeld und Sachleistungen (ambulanter
                    Pflegedienst) flexibel mischen. Wichtig: Sie erhalten nur das anteilige
                    Pflegegeld für den Prozentsatz, den Sie bei den Sachleistungen{' '}
                    <strong>nicht</strong> verbraucht haben.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Pflegegrad Auswahl */}
        <Card className="bg-white/5 border-white/10 text-white shadow-xl">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-lg font-bold text-white">
              Welcher Pflegegrad liegt vor?
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {pflegegrade.map((pg) => (
                <button
                  key={pg.pg}
                  onClick={() => setSelectedPG(pg.pg)}
                  className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col items-center text-center ${
                    selectedPG === pg.pg
                      ? 'border-[#20b2aa] bg-[#20b2aa]/10 text-white'
                      : 'border-white/10 text-gray-400 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div
                    className={`text-2xl font-bold ${selectedPG === pg.pg ? 'text-[#20b2aa]' : 'text-gray-300'}`}
                  >
                    {pg.pg}
                  </div>
                  <div className="text-xs font-semibold mt-1">{pg.bezeichnung}</div>
                  <div className="text-[10px] font-mono mt-2 opacity-60">Basis: {pg.basis} €</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Optionen */}
        <Card className="bg-white/5 border-white/10 text-white shadow-xl">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-lg font-bold">Gewünschte Leistungen</CardTitle>
            <CardDescription className="text-gray-400 text-xs">
              Klicken Sie auf die Bausteine, die monatlich abgerechnet werden sollen.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid md:grid-cols-2 gap-3">
              {pflegegeldOptionen.map((option) => (
                <button
                  key={option.name}
                  onClick={() => toggleOption(option.name)}
                  disabled={option.name === 'Pflegegeld' && gewaehlteOptionen.length === 1}
                  className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                    gewaehlteOptionen.includes(option.name)
                      ? 'border-[#20b2aa] bg-[#20b2aa]/10'
                      : 'border-white/5 bg-slate-950/20 hover:border-white/10 hover:bg-white/5'
                  } ${option.name === 'Pflegegeld' && gewaehlteOptionen.length === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{option.emoji}</span>
                    <div className="flex-1">
                      <div className="font-bold text-white text-sm">{option.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{option.beschreibung}</div>
                      <div className="text-[10px] font-bold text-[#20b2aa] mt-1.5 uppercase tracking-wide">
                        {option.prozent === 100
                          ? 'Voller Anspruch (100%)'
                          : `Anteilig (${option.prozent}%)`}
                      </div>
                    </div>
                    {gewaehlteOptionen.includes(option.name) && (
                      <div className="w-5 h-5 bg-[#20b2aa] rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-slate-950 font-bold" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ergebnis */}
        <Card
          className={`shadow-2xl transition-colors ${ueberschritten ? 'bg-rose-500/10 border-rose-500/30' : 'bg-white/5 border-white/10'}`}
        >
          <CardHeader
            className={`border-b pb-4 ${ueberschritten ? 'border-rose-500/20' : 'border-white/5'}`}
          >
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-white">
              <Euro className={`w-5 h-5 ${ueberschritten ? 'text-rose-400' : 'text-[#20b2aa]'}`} />
              Kalkuliertes Budget
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Summe */}
            <div className="text-center">
              <div
                className={`text-4xl sm:text-5xl font-extrabold tracking-tight ${ueberschritten ? 'text-rose-400' : 'text-white'}`}
              >
                {aktuelleSumme.toFixed(2)} €
              </div>
              <div className="text-gray-400 text-xs mt-2 font-mono">
                Referenz-Deckelung: {maxBetrag.toFixed(2)} €
              </div>
            </div>

            {/* Fortschrittsbalken */}
            <div className="w-full bg-slate-950/50 rounded-full h-3 border border-white/5 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ease-out ${
                  ueberschritten ? 'bg-rose-500' : 'bg-[#20b2aa]'
                }`}
                style={{ width: `${Math.min(100, (aktuelleSumme / maxBetrag) * 100)}%` }}
              />
            </div>

            {/* Status Feedback */}
            {ueberschritten ? (
              <div className="bg-rose-500/20 border border-rose-500/30 text-rose-300 p-4 rounded-xl text-center text-sm">
                <strong>⚠️ Kombinationsgrenze überschritten!</strong>
                <br />
                Die theoretische Leistung übersteigt den Rahmen um{' '}
                {(aktuelleSumme - maxBetrag).toFixed(2)} €. Die Pflegekasse wird dies anteilig
                kürzen.
              </div>
            ) : restBudget > 0 ? (
              <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 p-4 rounded-xl text-sm">
                <strong>💡 Optimierungs-Tipp:</strong> Sie schöpfen Ihr Budget noch nicht voll aus.
                Es verbleibt ein Puffer von {restBudget.toFixed(2)} €, der für zusätzliche
                Sachleistungen genutzt werden kann.
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-center text-sm">
                <strong>✅ Perfekt balanciert!</strong> Sie nutzen das gesetzliche Budget ideal aus.
              </div>
            )}

            {/* Listen-Details */}
            <div className="border-t border-white/5 pt-4">
              <h4 className="font-semibold text-white text-sm mb-3">Zusammensetzung:</h4>
              <ul className="space-y-2">
                {gewaehlteOptionen.map((name) => {
                  const option = pflegegeldOptionen.find((o) => o.name === name);
                  const betrag = option ? basisBetrag * (option.prozent / 100) : 0;
                  return (
                    <li
                      key={name}
                      className="flex justify-between items-center text-sm text-gray-300 bg-slate-950/30 p-2.5 rounded-lg border border-white/5"
                    >
                      <span className="flex items-center gap-2">
                        {option?.emoji} {name}
                      </span>
                      <span className="font-mono text-white">{betrag.toFixed(2)} €</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Erklär-Cards / Tipps */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-white/5 border-white/10 text-white hover:bg-white/[0.07] transition-colors">
            <CardHeader className="pb-2">
              <Home className="w-6 h-6 text-[#20b2aa] mb-1" />
              <CardTitle className="text-base font-bold text-white">Sachleistungen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-xs leading-relaxed">
                Der Pflegedienst rechnet direkt mit der Kasse ab. Nutzen Sie dies nicht voll, wird
                das Pflegegeld anteilig an Sie ausgezahlt.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white hover:bg-white/[0.07] transition-colors">
            <CardHeader className="pb-2">
              <Clock className="w-6 h-6 text-[#20b2aa] mb-1" />
              <CardTitle className="text-base font-bold text-white">Verhinderungspflege</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-xs leading-relaxed">
                Ideal für Urlaub oder Krankheit der Pflegeperson. Der Anspruch beträgt bis zu 42
                Tage im Kalenderjahr (separates Budget).
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white hover:bg-white/[0.07] transition-colors">
            <CardHeader className="pb-2">
              <Users className="w-6 h-6 text-[#20b2aa] mb-1" />
              <CardTitle className="text-base font-bold text-white">Tagespflege</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-xs leading-relaxed">
                Teilstationäre Betreuung am Tag. Dieses Budget wird oft <strong>zusätzlich</strong>{' '}
                gewährt und kürzt das Pflegegeld nicht zwingend!
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-between pt-4 border-t border-white/5">
          <Link
            href={`/${locale}/pflegegrad/ergebnis`}
            className="inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 h-11 px-6 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Zurück zum Gutachten
          </Link>

          <Link
            href={`/${locale}/unterstuetzung`}
            className="inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold bg-[#20b2aa] hover:bg-[#3ddbd0] text-slate-950 shadow-md h-11 px-6 transition-all"
          >
            Pflegedienste suchen <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
