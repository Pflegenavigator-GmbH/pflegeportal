// src/app/[locale]/impressum/page.tsx
import { Building2, Mail, Globe, Shield, FileText, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Impressum - PflegeNavigator EU',
  description: 'Impressum und rechtliche Angaben der PflegeNavigator EU gUG',
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function ImpressumPage(props: PageProps) {
  const { locale } = await props.params;

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header Chrome */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#0f2744] to-[#20b2aa] rounded-2xl shadow-xl border border-white/10">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Impressum</h1>
          <p className="text-gray-400 text-sm">Rechtliche Angaben nach § 5 TMG</p>
        </div>

        {/* Angaben nach § 5 TMG */}
        <Card className="bg-white/5 border-white/10 text-white shadow-xl">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-white">
              <Building2 className="w-5 h-5 text-[#20b2aa]" />
              Angaben nach § 5 TMG
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4 text-xs sm:text-sm text-gray-300">
            <div className="space-y-1">
              <p className="font-bold text-white text-lg">PflegeNavigator EU gUG (in Gründung)</p>
              <p className="text-gray-400 text-xs">(haftungsbeschränkt)</p>
              <p className="pt-2">Geschäftsführer: André Schulz</p>
              <p>Amtsgericht: Bielefeld</p>
              <p>HRB: [Nummer eintragen]</p>
              <p>USt-IdNr.: [Nummer eintragen]</p>
            </div>

            <div className="h-px bg-white/5 my-4" />

            <div className="space-y-1">
              <p className="font-semibold text-white">Postanschrift:</p>
              <p>Heeper Straße 205</p>
              <p>33607 Bielefeld</p>
            </div>

            <div className="space-y-1">
              <p className="font-semibold flex items-center gap-2 text-white">
                <Mail className="w-4 h-4 text-[#20b2aa]" />
                E-Mail:
              </p>
              <a
                href="mailto:info@pflegenavigatoreu.com"
                className="text-[#20b2aa] hover:underline"
              >
                info@pflegenavigatoreu.com
              </a>
            </div>

            <div className="space-y-1">
              <p className="font-semibold flex items-center gap-2 text-white">
                <Globe className="w-4 h-4 text-[#20b2aa]" />
                Website:
              </p>
              <a href="https://pflegenavigatoreu.com" className="text-[#20b2aa] hover:underline">
                https://pflegenavigatoreu.com
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Haftungsausschluss */}
        <Card className="border-amber-500/20 bg-amber-500/5 text-white shadow-xl">
          <CardHeader className="border-b border-amber-500/10 pb-4">
            <CardTitle className="flex items-center gap-2 text-amber-400 text-base font-bold">
              <AlertCircle className="w-5 h-5" />
              Wichtiger regulatorischer Hinweis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs text-gray-300 leading-relaxed">
            <p>
              <strong>Keine Rechtsberatung:</strong> Die PflegeNavigator EU gUG bietet keine
              Rechtsberatung, keine medizinische Beratung und keine verbindliche Auskunft über
              Leistungsansprüche. Die automatisierten Auswertungen sind als reine
              Orientierungshilfen zu verstehen.
            </p>
            <p>
              <strong>Keine Garantie:</strong> Verbindliche und rechtskräftige Entscheidungen im
              Einzelfall treffen ausschließlich die zuständigen staatlichen Stellen und
              Leistungsträger (Medizinischer Dienst, Pflegekassen, etc.).
            </p>
          </CardContent>
        </Card>

        {/* Streitschlichtung */}
        <Card className="bg-white/5 border-white/10 text-white shadow-xl">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-white">
              <Shield className="w-4 h-4 text-[#20b2aa]" /> Streitschlichtung
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 text-xs text-gray-300 space-y-3">
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
              bereit:
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#20b2aa] hover:underline ml-1"
              >
                https://ec.europa.eu/consumers/odr
              </a>
            </p>
            <p className="text-gray-400">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </CardContent>
        </Card>

        {/* Urheberrecht & Inhalte */}
        <Card className="bg-white/5 border-white/10 text-white shadow-xl">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-white">
              <FileText className="w-4 h-4 text-[#20b2aa]" /> Urheberrecht & Haftung
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 text-xs text-gray-400 leading-relaxed space-y-3">
            <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
              unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung
              und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der
              schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </CardContent>
        </Card>

        {/* SPA-konformer Back-Button */}
        <div className="flex justify-center pt-4">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 h-11 px-6 transition-all shadow-md"
          >
            <ArrowLeft className="w-4 h-4" /> Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
