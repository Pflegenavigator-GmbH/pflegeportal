'use client';

import {
  HelpCircle,
  Search,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Phone,
  Mail,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/src/components/ui';

/**
 * Struktur der Fragen — ohne Text.
 *
 * ID, Kategorie und Häufigkeit steuern Filter und Sortierung und sind damit
 * sprachunabhängig. Frage und Antwort liegen in `public/locales/<sprache>/faq.json`.
 * `as const` sichert die Prüfung der zusammengesetzten Schlüssel.
 */
const FAQ_STRUKTUR = [
  { id: '1', kategorie: 'pflegegrad', haeufigkeit: 5 },
  { id: '2', kategorie: 'pflegegrad', haeufigkeit: 5 },
  { id: '3', kategorie: 'pflegegrad', haeufigkeit: 4 },
  { id: '4', kategorie: 'pflegegrad', haeufigkeit: 5 },
  { id: '5', kategorie: 'widerspruch', haeufigkeit: 5 },
  { id: '6', kategorie: 'widerspruch', haeufigkeit: 4 },
  { id: '7', kategorie: 'leistungen', haeufigkeit: 4 },
  { id: '8', kategorie: 'leistungen', haeufigkeit: 4 },
  { id: '9', kategorie: 'geld', haeufigkeit: 5 },
  { id: '10', kategorie: 'migration', haeufigkeit: 5 },
  { id: '11', kategorie: 'migration', haeufigkeit: 4 },
  { id: '12', kategorie: 'technik', haeufigkeit: 3 },
  { id: '13', kategorie: 'technik', haeufigkeit: 3 },
  { id: '14', kategorie: 'recht', haeufigkeit: 3 },
  { id: '15', kategorie: 'recht', haeufigkeit: 4 },
] as const;

const KATEGORIEN = [
  'alle',
  'pflegegrad',
  'widerspruch',
  'leistungen',
  'geld',
  'migration',
  'recht',
  'technik',
] as const;

export default function FAQPage() {
  const t = useTranslations('faq');
  const router = useRouter();
  const [suchbegriff, setSuchbegriff] = useState('');
  const [geoeffneteFrage, setGeoeffneteFrage] = useState<string | null>(null);
  const [aktiveKategorie, setAktiveKategorie] = useState('alle');

  // Texte aus den Übersetzungen an die Struktur heften — die Suche muss über
  // den ANGEZEIGTEN Text laufen, sonst findet ein englischer Nutzer nichts.
  const faqs = useMemo(
    () =>
      FAQ_STRUKTUR.map(({ id, kategorie, haeufigkeit }) => ({
        id,
        kategorie,
        haeufigkeit,
        frage: t(`fragen.${id}.frage`),
        antwort: t(`fragen.${id}.antwort`),
      })),
    [t]
  );

  const gefilterteFAQs = faqs.filter((faq) => {
    const passtKategorie = aktiveKategorie === 'alle' || faq.kategorie === aktiveKategorie;
    const passtSuche =
      suchbegriff === '' ||
      faq.frage.toLowerCase().includes(suchbegriff.toLowerCase()) ||
      faq.antwort.toLowerCase().includes(suchbegriff.toLowerCase());
    return passtKategorie && passtSuche;
  });

  // Sortiere nach Häufigkeit (beliebteste zuerst)
  const sortierteFAQs = [...gefilterteFAQs].sort((a, b) => b.haeufigkeit - a.haeufigkeit);

  const toggleFrage = (id: string) => {
    setGeoeffneteFrage(geoeffneteFrage === id ? null : id);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#20b2aa] to-[#3ddbd0] rounded-2xl shadow-xl mb-6">
            <HelpCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#0f2744] mb-4">{t('titel')}</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">{t('untertitel')}</p>
        </div>

        {/* Suchleiste */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
            <Input
              type="text"
              placeholder={t('suchePlatzhalter')}
              value={suchbegriff}
              onChange={(e) => setSuchbegriff(e.target.value)}
              className="pl-14 py-6 text-lg rounded-2xl border-2 border-slate-200 focus:border-[#20b2aa]"
            />
          </div>
        </div>

        {/* Kategorie-Tabs */}
        <Tabs value={aktiveKategorie} onValueChange={setAktiveKategorie} className="mb-10">
          <TabsList className="flex flex-wrap justify-center h-auto gap-2 bg-transparent">
            {KATEGORIEN.map((kat) => (
              <TabsTrigger
                key={kat}
                value={kat}
                className="data-[state=active]:bg-[#20b2aa] data-[state=active]:text-white px-4 py-2"
              >
                {t(`kategorien.${kat}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* FAQ-Liste */}
        <div className="space-y-4 mb-12">
          {sortierteFAQs.map((faq) => (
            <Card
              key={faq.id}
              className={`transition-all duration-200 ${
                geoeffneteFrage === faq.id ? 'ring-2 ring-[#20b2aa]' : 'hover:shadow-md'
              }`}
            >
              <div className="p-6 cursor-pointer" onClick={() => toggleFrage(faq.id)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {faq.haeufigkeit >= 4 && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          {t('beliebt')}
                        </span>
                      )}
                      <span className="text-xs text-slate-400 capitalize">
                        {t(`kategorien.${faq.kategorie}`)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-[#0f2744] pr-8">{faq.frage}</h3>
                  </div>
                  <div className="flex-shrink-0">
                    {geoeffneteFrage === faq.id ? (
                      <ChevronUp className="w-6 h-6 text-[#20b2aa]" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                </div>

                {geoeffneteFrage === faq.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-slate-600 leading-relaxed">{faq.antwort}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Keine Ergebnisse */}
        {sortierteFAQs.length === 0 && (
          <Card className="text-center py-12">
            <HelpCircle className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">{t('keineTreffer')}</h3>
            <p className="text-slate-500 mb-6">{t('keineTrefferHinweis')}</p>
            <Button
              variant="outline"
              onClick={() => {
                setSuchbegriff('');
                setAktiveKategorie('alle');
              }}
            >
              Alle Fragen anzeigen
            </Button>
          </Card>
        )}

        {/* Weitere Hilfe */}
        <Card className="bg-[#0f2744] text-white">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageCircle className="w-6 h-6" />
              {t('kontakt.titel')}
            </CardTitle>
            <CardDescription className="text-blue-200">{t('kontakt.untertitel')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#20b2aa] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t('kontakt.email')}</h3>
                  <p className="text-blue-200 text-sm">info@pflegenavigatoreu.com</p>
                  <p className="text-blue-300 text-xs mt-1">{t('kontakt.emailAntwort')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#20b2aa] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t('kontakt.hotline')}</h3>
                  <p className="text-blue-200 text-sm">030 20 45 28 28</p>
                  <p className="text-blue-300 text-xs mt-1">{t('kontakt.hotlineZeiten')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t text-center">
          <Button variant="outline" onClick={() => router.push('/')} size="lg">
            <ArrowLeft className="mr-2 w-4 h-4" />
            {t('zurueck')}
          </Button>
        </footer>
      </div>
    </main>
  );
}
