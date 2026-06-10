// src/app/[locale]/presse/page.tsx
'use client';

import {
  Newspaper,
  ArrowRight,
  ArrowLeft,
  Search,
  Calendar,
  ExternalLink,
  FileText,
  Download,
  Mail,
  Globe,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, use } from 'react';

import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';

interface PageProps {
  params: Promise<{ locale: string }>;
}

// Hochaktuelle Pflege-Themen (Stand 2026)
const beispielMeldungen = [
  {
    id: 1,
    datum: '02. Juni 2026',
    titel: 'Neues Entlastungsbudget 2026: Was Angehörige jetzt wissen müssen',
    unterzeile: 'Zusammenlegung von Verhinderungs- und Kurzzeitpflege',
    kategorie: 'Recht',
    zusammenfassung:
      'Das lange erwartete gemeinsame Entlastungsbudget ist da. Der PflegeNavigator EU berechnet ab sofort automatisch Ihre neuen, flexibleren Budgets für die häusliche Pflege.',
  },
  {
    id: 2,
    datum: '15. Mai 2026',
    titel: 'Pflegekraftmangel: Digitale Fast-Lanes für ausländische Fachkräfte',
    unterzeile: 'Wie Bürokratieabbau die Anerkennung beschleunigt',
    kategorie: 'Migration',
    zusammenfassung:
      'Neue gesetzliche Regelungen zur Fachkräfteeinwanderung greifen. Wir zeigen, wie Pflegedienste den Anerkennungsprozess durch digitale Dokumentenprüfung nun in Wochen statt Monaten abschließen.',
  },
  {
    id: 3,
    datum: '27. April 2026',
    titel: 'PflegeNavigator EU startet europaweite Beta-Phase',
    unterzeile: 'Barrierefreier Pflegegrad-Rechner in 35 Sprachen',
    kategorie: 'Produktlaunch',
    zusammenfassung:
      'Pflegeberatung ohne Sprachbarrieren: Unser KI-gestütztes Portal ermöglicht Angehörigen erstmals eine fundierte Vorbereitung auf den MDK-Besuch in ihrer Muttersprache.',
  },
  {
    id: 4,
    datum: '10. März 2026',
    titel: 'KI im Pflegealltag: 80% Zeitersparnis bei der Dokumentation',
    unterzeile: 'Aktuelle Nutzerstatistiken unseres Pflege-Tagebuchs',
    kategorie: 'Statistik',
    zusammenfassung:
      'Eine Auswertung von über 10.000 anonymisierten Nutzerprofilen zeigt: Automatisierte Sprach-zu-Text-Tagebücher senken den Stresslevel pflegender Angehöriger messbar.',
  },
];

const kategorien = ['Alle', 'Produktlaunch', 'Recht', 'Statistik', 'Migration'];

export default function PresseportalPage(props: PageProps) {
  const router = useRouter();
  const params = use(props.params);
  const locale = params?.locale || 'de';

  const [suchbegriff, setSuchbegriff] = useState('');
  const [aktiveKategorie, setAktiveKategorie] = useState('Alle');

  // Such- und Filterlogik, damit die States genutzt werden
  const gefilterteMeldungen = beispielMeldungen.filter((meldung) => {
    const passtZurKategorie = aktiveKategorie === 'Alle' || meldung.kategorie === aktiveKategorie;
    const passtZumSuchbegriff =
      meldung.titel.toLowerCase().includes(suchbegriff.toLowerCase()) ||
      meldung.zusammenfassung.toLowerCase().includes(suchbegriff.toLowerCase());

    return passtZurKategorie && passtZumSuchbegriff;
  });

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 text-slate-900">
      <div className="container mx-auto max-w-6xl">
        {/* Hero Sektion */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#0f2744] rounded-2xl shadow-xl mb-6">
            <Newspaper className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#0f2744] mb-4">Presseportal & Blog</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Aktuelle Einblicke in die Pflegepolitik, neue Features und Ressourcen für Journalisten.
          </p>
        </div>

        {/* Filter & Suche */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-10 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-wrap gap-2">
            {kategorien.map((kat) => (
              <Button
                key={kat}
                variant={aktiveKategorie === kat ? 'default' : 'outline'}
                onClick={() => setAktiveKategorie(kat)}
                className={
                  aktiveKategorie === kat
                    ? 'bg-[#20b2aa] hover:bg-[#1a908a] text-white'
                    : 'border-slate-300 text-slate-600'
                }
                size="sm"
              >
                {kat}
              </Button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Artikel suchen..."
              value={suchbegriff}
              onChange={(e) => setSuchbegriff(e.target.value)}
              className="pl-9 border-slate-300 focus-visible:ring-[#20b2aa]"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Linke Spalte: Artikel & News (Nimmt 2/3 des Platzes ein) */}
          <div className="lg:col-span-2 space-y-6">
            {gefilterteMeldungen.length > 0 ? (
              gefilterteMeldungen.map((meldung) => (
                <Card
                  key={meldung.id}
                  className="border-slate-200 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold text-[#20b2aa] uppercase tracking-wider bg-teal-50 px-2 py-1 rounded-md">
                        {meldung.kategorie}
                      </span>
                      <div className="flex items-center text-slate-400 text-xs font-medium">
                        <Calendar className="w-3 h-3 mr-1" />
                        {meldung.datum}
                      </div>
                    </div>
                    <CardTitle className="text-xl text-[#0f2744] group-hover:text-[#20b2aa] transition-colors cursor-pointer">
                      {meldung.titel}
                    </CardTitle>
                    <CardDescription className="text-sm font-medium text-slate-500">
                      {meldung.unterzeile}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                      {meldung.zusammenfassung}
                    </p>
                    <Button
                      variant="ghost"
                      className="text-[#0f2744] hover:text-[#20b2aa] hover:bg-slate-100 p-0 h-auto font-semibold"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Ganzen Artikel lesen <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-900">Keine Ergebnisse gefunden</h3>
                <p className="text-slate-500 text-sm">
                  Versuchen Sie einen anderen Suchbegriff oder eine andere Kategorie.
                </p>
              </div>
            )}
          </div>

          {/* Rechte Spalte: Pressekontakt & Media Kit */}
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm bg-[#0f2744] text-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#20b2aa]" /> Pressekontakt
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Für Interviewanfragen und Bildmaterial stehen wir Journalisten gerne zur
                  Verfügung.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm">
                  <p className="font-semibold text-white">Pressestelle PflegeNavigator</p>
                  <p className="text-slate-300">presse@pflegenavigatoreu.com</p>
                  <p className="text-slate-300">+49 (0) 800 123 456</p>
                </div>
                <Button className="w-full bg-[#20b2aa] hover:bg-[#1a908a] text-white">
                  Nachricht schreiben
                </Button>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-[#0f2744]">
                  <Download className="w-5 h-5 text-[#20b2aa]" /> Media Kit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600 mb-4">
                  Laden Sie unser offizielles Pressepaket mit Logos in hoher Auflösung, Gründerfotos
                  und dem aktuellen Factsheet herunter.
                </p>
                <Button variant="outline" className="w-full justify-start text-slate-700">
                  <Download className="w-4 h-4 mr-2 text-slate-400" /> Logos (.zip)
                </Button>
                <Button variant="outline" className="w-full justify-start text-slate-700">
                  <FileText className="w-4 h-4 mr-2 text-slate-400" /> Factsheet 2026 (.pdf)
                </Button>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <Globe className="w-8 h-8 text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-[#0f2744]">Social Media</p>
                  <a href="#" className="text-xs text-[#20b2aa] flex items-center hover:underline">
                    Folgen Sie uns auf LinkedIn <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <footer className="mt-12 pt-6 border-t border-slate-200 text-center">
          <Button
            variant="ghost"
            onClick={() => router.push(`/${locale}`)}
            className="text-slate-600 hover:text-[#0f2744]"
          >
            <ArrowLeft className="mr-2 w-4 h-4" /> Zurück zur Startseite
          </Button>
        </footer>
      </div>
    </main>
  );
}
