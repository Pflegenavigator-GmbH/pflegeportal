'use client';

import {
  Phone,
  MapPin,
  Search,
  Star,
  Users,
  GraduationCap,
  Heart,
  AlertCircle,
  LifeBuoy,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Euro,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, Suspense, lazy, use } from 'react';
import { toast } from 'sonner';

import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';

const AvatarChat = lazy(() => import('@/src/components/AvatarChat'));

interface PageProps {
  params: Promise<{ locale: string }>;
}

// Typisierung basierend auf dem neuen Supabase-Tabellenmodell
interface PflegedienstRow {
  id: number;
  name: string;
  strasse: string | null;
  plz: string;
  stadt: string;
  telefon: string | null;
  bewertung: number;
}

const kursAnbieter = [
  {
    id: 1,
    name: 'Deutsches Rotes Kreuz',
    ort: 'Deutschlandweit',
    kosten: '0 € (Kassenleistung § 45)',
    dauer: 'Kompaktkurse / Online',
    telefon: '0800-123456',
  },
  {
    id: 2,
    name: 'Johanniter Unfallhilfe',
    ort: 'Deutschlandweit',
    kosten: '0 € (Kassenleistung § 45)',
    dauer: 'Abendkurse / Präsenz',
    telefon: '0800-654321',
  },
];

const notfallKontakte = [
  { nummer: '112', name: 'Rettungsdienst & Notarzt', beschreibung: 'Bei akuter Lebensgefahr' },
  {
    nummer: '116 117',
    name: 'Ärztlicher Bereitschaftsdienst',
    beschreibung: 'Außerhalb der Praxisöffnungszeiten',
  },
  {
    nummer: '0800 111 0 111',
    name: 'Telefonseelsorge / Krisenhilfe',
    beschreibung: 'Kostenfreie psychosoziale Beratung',
  },
];

export default function UnterstuetzungPage(props: PageProps) {
  const router = useRouter();
  const params = use(props.params);
  const locale = params?.locale || 'de';

  const [suchOrt, setSuchOrt] = useState('');
  // Reaktiver State für die geladenen Supabase-Daten
  const [dienste, setDienste] = useState<PflegedienstRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedKurs, setExpandedKurs] = useState<number | null>(null);
  const [expandedAngehoerige, setExpandedAngehoerige] = useState(false);

  // ⚡ Debounced oder Event-gesteuerter DB-Fetch statt lokaler Filterung
  const triggerLiveSuche = async (val: string) => {
    setSuchOrt(val);
    if (val.trim().length < 2) {
      setDienste([]);
      return;
    }

    setLoading(true);
    try {
      // ✅ FIX: Füge den Trailing-Slash "/" direkt nach 'search' ein,
      // damit Next.js nicht intern einen 307-Redirect erzwingen muss!
      const response = await fetch(`/api/unterstuetzung/search/?query=${encodeURIComponent(val)}`);

      if (!response.ok) throw new Error();
      const data = await response.json();
      setDienste(data);
    } catch {
      toast.error('Fehler beim Abruf der Pflegedienste.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <header className="bg-slate-950/40 border-b border-white/10 py-6">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold tracking-tight">Unterstützung & Pflegenetzwerk</h1>
          <p className="text-[#20b2aa] text-sm mt-1">
            Regionale Dienstleister, kostenlose Pflegekurse und Notfall-Schnittstellen
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Pflegedienst suchen */}
            <Card className="bg-white/5 border-white/10 text-white shadow-xl">
              <CardHeader className="border-b border-white/5 pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Search className="w-5 h-5 text-[#20b2aa]" /> Ambulante Pflegedienste vor Ort
                </CardTitle>
                <CardDescription className="text-gray-400 text-xs">
                  Gleichen Sie freie Kapazitäten über die Supabase-Cluster ab
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="relative mb-4">
                  <Input
                    placeholder="PLZ oder Stadt eingeben (z.B. 33607 oder Berlin)..."
                    value={suchOrt}
                    onChange={(e) => triggerLiveSuche(e.target.value)}
                    className="bg-slate-950/50 border-white/10 text-white h-11 pr-10"
                  />
                  {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#20b2aa] border-t-transparent rounded-full animate-spin" />
                  )}
                </div>

                <div className="space-y-2">
                  {dienste.map((dienst) => (
                    <div
                      key={dienst.id}
                      className="border border-white/5 bg-slate-950/20 rounded-xl p-4 flex justify-between items-center hover:bg-white/5 transition-all"
                    >
                      <div>
                        <h3 className="font-semibold text-white text-sm">{dienst.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {dienst.strasse || 'Hauptstraße'}
                        </p>
                        <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {dienst.plz} {dienst.stadt}
                          </span>
                          {dienst.telefon && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5" /> {dienst.telefon}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400 bg-amber-400/5 px-2.5 py-1 border border-amber-400/10 rounded-lg text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" /> {dienst.bewertung.toFixed(1)}
                      </div>
                    </div>
                  ))}

                  {!loading && suchOrt.length >= 2 && dienste.length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-4">
                      Keine registrierten Dienste für diese Eingabe gefunden.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pflegekurse §45 */}
            <Card className="bg-white/5 border-white/10 text-white shadow-xl">
              <CardHeader className="border-b border-white/5 pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#20b2aa]" /> Schulungen für Angehörige (§
                  45 SGB XI)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="bg-[#20b2aa]/10 border border-20b2aa/20 p-4 rounded-xl text-xs text-gray-300">
                  <strong>Gesetzes-Anspruch:</strong> Pflegekassen bieten Angehörigen unentgeltliche
                  Schulungskurse an, um die Pflege zu erleichtern.
                </div>
                <div className="space-y-2">
                  {kursAnbieter.map((anbieter) => (
                    <div
                      key={anbieter.id}
                      className="border border-white/5 bg-slate-950/20 rounded-xl overflow-hidden"
                    >
                      <button
                        className="w-full p-4 flex justify-between items-center hover:bg-white/5 text-left text-sm font-medium transition-colors"
                        onClick={() =>
                          setExpandedKurs(expandedKurs === anbieter.id ? null : anbieter.id)
                        }
                      >
                        <span>{anbieter.name}</span>
                        {expandedKurs === anbieter.id ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      {expandedKurs === anbieter.id && (
                        <div className="p-4 bg-slate-950/40 border-t border-white/5 text-xs space-y-2 text-gray-300">
                          <p className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-gray-500" /> {anbieter.ort}
                          </p>
                          <p className="flex items-center gap-2">
                            <Euro className="w-3.5 h-3.5 text-emerald-400" /> {anbieter.kosten}
                          </p>
                          <p className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-gray-500" /> {anbieter.dauer}
                          </p>
                          <Button className="mt-2 w-full bg-[#20b2aa] hover:bg-[#1a9994] text-slate-950 font-bold h-9 text-xs">
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Schulungsplatz anfragen
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notfallkontakte */}
            <Card className="border-rose-500/30 bg-rose-500/5 text-white">
              <CardHeader className="border-b border-rose-500/10 pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-rose-400">
                  <AlertCircle className="w-5 h-5" /> Medizinische Notsituationen & Krisendienste
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {notfallKontakte.map((kontakt, i) => (
                    <a
                      key={i}
                      href={`tel:${kontakt.nummer.replace(/\s/g, '')}`}
                      className="p-4 bg-slate-950/40 border border-white/5 rounded-xl hover:border-rose-500/30 text-center block transition-all group"
                    >
                      <p className="text-xl font-extrabold text-rose-400 group-hover:scale-105 transition-transform">
                        {kontakt.nummer}
                      </p>
                      <p className="font-bold text-xs text-white mt-1">{kontakt.name}</p>
                      <p className="text-[10px] text-gray-400 mt-1 leading-snug">
                        {kontakt.beschreibung}
                      </p>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="sticky top-20">
              <Card className="bg-white/5 border-white/10 overflow-hidden shadow-2xl">
                <CardHeader className="bg-[#20b2aa] text-slate-950 p-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" /> Live-Pflegeassistent
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 h-[420px] bg-slate-950/20">
                  <Suspense
                    fallback={
                      <div className="h-full flex items-center justify-center text-xs text-gray-500 animate-pulse">
                        Kompiliere Audio-Schnittstelle...
                      </div>
                    }
                  >
                    <AvatarChat
                      topic="unterstuetzung"
                      initialMessage="Hallo! Ich helfe Ihnen bei Fragen zu Pflegediensten, Kursen oder Notfallkontakten. Was möchten Sie wissen?"
                      showVoiceHints={true}
                    />
                  </Suspense>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/${locale}`)}
            className="text-gray-400 hover:text-white hover:bg-white/5 h-11 px-6 rounded-xl"
          >
            <ArrowLeft className="mr-2 w-4 h-4" /> Zurück zur Hauptübersicht
          </Button>
        </div>
      </main>
    </div>
  );
}
