'use client';

import {
  HelpCircle,
  ArrowRight,
  FileText,
  Calculator,
  Users,
  Phone,
  Search,
  Lightbulb,
  ArrowLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, use } from 'react';

import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
} from '@/src/components/ui';

interface PageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Struktur ohne Text: Reihenfolge, Icon, Farbe und Ziel sind Darstellung bzw.
 * Navigation und damit sprachunabhängig. Die Beschriftungen kommen aus
 * `hilfe.json`. `as const` hält die IDs als Literale, sonst ließe sich
 * `t(`fragen.${id}.frage`)` nicht gegen die vorhandenen Schlüssel prüfen.
 */
const FRAGEN_IDS = ['pflegegrad', 'dauer', 'widerspruch'] as const;

const THEMEN = [
  { id: 'rechner', icon: Calculator, link: '/pflegegrad/start', color: 'bg-[#20b2aa]' },
  { id: 'widerspruch', icon: FileText, link: '/widerspruch', color: 'bg-amber-500' },
  { id: 'dienste', icon: Users, link: '/unterstuetzung', color: 'bg-blue-500' },
] as const;

export default function HilfePage(props: PageProps) {
  const router = useRouter();
  const t = useTranslations('hilfe');
  const params = use(props.params);
  const locale = params?.locale || 'de';
  const [searchQuery, setSearchQuery] = useState('');
  // Nach ID statt nach Index: Beim Tippen in die Suche verschieben sich die
  // Indizes der gefilterten Liste, und es klappte die falsche Antwort auf.
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  // Erst übersetzen, dann filtern — sonst durchsucht die Suche die deutschen
  // Quelltexte, während der Bildschirm die englischen zeigt.
  const haeufigeFragen = FRAGEN_IDS.map((id) => ({
    id,
    frage: t(`fragen.${id}.frage`),
    antwort: t(`fragen.${id}.antwort`),
  }));

  const suchbegriff = searchQuery.toLowerCase();
  const filteredFaqs = haeufigeFragen.filter(
    (faq) =>
      faq.frage.toLowerCase().includes(suchbegriff) ||
      faq.antwort.toLowerCase().includes(suchbegriff)
  );

  return (
    <main className="min-h-screen bg-slate-900 text-white py-12 px-4 font-sans">
      <div className="container mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-500/10 border border-purple-500/30 rounded-2xl shadow-xl mb-4">
            <HelpCircle className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t('titel')}</h1>
          <p className="text-sm text-gray-400 mt-1">{t('untertitel')}</p>
        </div>

        {/* Suchfeld */}
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            type="text"
            placeholder={t('suchePlatzhalter')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-slate-950/50 border-white/10 text-white rounded-xl focus:border-purple-500"
          />
        </div>

        {/* Kachel-Themen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {THEMEN.map((thema) => (
            <Card
              key={thema.id}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 cursor-pointer transition-all flex flex-col justify-between"
              onClick={() => router.push(`/${locale}${thema.link}`)}
            >
              <CardHeader className="p-5 pb-3">
                <div
                  className={`w-10 h-10 ${thema.color} rounded-xl flex items-center justify-center mb-3 text-slate-950`}
                >
                  <thema.icon className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-base font-bold text-white">
                  {t(`themen.${thema.id}.titel`)}
                </CardTitle>
                <CardDescription className="text-gray-400 text-xs mt-1">
                  {t(`themen.${thema.id}.beschreibung`)}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <Button
                  variant="link"
                  className="text-[#20b2aa] p-0 text-xs flex items-center gap-1 hover:no-underline"
                >
                  {t('sektionOeffnen')} <ArrowRight className="w-3 h-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQs */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" /> {t('faqTitel')}
          </h2>
          {filteredFaqs.map((faq) => (
            <Card
              key={faq.id}
              className="bg-white/5 border-white/10 text-white cursor-pointer hover:bg-white/[0.07] transition-all"
              onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
            >
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>{faq.frage}</span>
                  <span className="text-gray-500 font-mono">
                    {expandedFaq === faq.id ? '−' : '+'}
                  </span>
                </CardTitle>
              </CardHeader>
              {expandedFaq === faq.id && (
                <CardContent className="p-4 pt-0 text-xs text-gray-400 border-t border-white/5 bg-slate-950/20 leading-relaxed">
                  {faq.antwort}
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Telefon-Hotline */}
        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" /> {t('hotlineTitel')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <p className="text-3xl font-extrabold text-emerald-400">030 20 45 28 28</p>
            <p className="text-xs text-gray-400 mt-1">{t('hotlineZeiten')}</p>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            onClick={() => router.push(`/${locale}`)}
            className="text-gray-400 hover:text-white hover:bg-white/5 h-11 px-6 rounded-xl"
          >
            <ArrowLeft className="mr-2 w-4 h-4" /> {t('zurueck')}
          </Button>
        </div>
      </div>
    </main>
  );
}
