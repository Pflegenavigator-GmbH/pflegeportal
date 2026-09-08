// src/app/[locale]/datenschutz/page.tsx
'use client';

import {
  Shield,
  Lock,
  Eye,
  Server,
  User,
  Mail,
  FileText,
  ArrowRight,
  ArrowLeft,
  BarChart3,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use } from 'react';

import { CookieEinstellungenButton } from '@/src/components/legal/CookieEinstellungenButton';
import { Sprachhinweis } from '@/src/components/rechtliches/Sprachhinweis';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function DatenschutzPage(props: PageProps) {
  const router = useRouter();
  const params = use(props.params);
  const locale = params?.locale || 'de';

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <Sprachhinweis />
        {/* Header Chrome */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#0f2744] to-[#20b2aa] rounded-2xl shadow-xl border border-white/10">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Datenschutzerklärung</h1>
          <p className="text-gray-400 text-sm">
            Verschlüsselte In-Memory Verarbeitung nach EU-Standard (DSGVO)
          </p>
        </div>

        {/* Quick Overview */}
        <Card className="bg-white/5 border-white/10 text-white shadow-xl">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="flex items-center gap-2 text-[#20b2aa] text-base font-bold">
              <Lock className="w-5 h-5" /> Digitale Souveränität im Fokus
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2 text-xs sm:text-sm text-gray-300">
            <p className="flex items-start gap-2">
              <span className="text-[#20b2aa]">✓</span>
              <span>
                Anonyme Fall-Musterung: Speicherung erfolgt ausschließlich über einen **zufälligen
                Code** (z.B. PF-ABC123).
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-[#20b2aa]">✓</span>
              <span>
                Geografische Isolation: Infrastruktur gehostet auf ISO-27001-zertifizierten Servern
                in **Frankfurt, Deutschland**.
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-[#20b2aa]">✓</span>
              <span>
                Zweckbindung: Keine kommerzielle Datenweitergabe, kein Werbe-Tracking, kein
                Werbe-Verkauf. Die anonyme Reichweitenmessung läuft nur mit Ihrer Einwilligung
                (siehe unten).
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Verweis-Schaltflächen zu den Auskunfts-/Löschformularen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card
            className="bg-white/5 border-white/10 text-white shadow-md hover:bg-white/[0.08] transition-all cursor-pointer"
            onClick={() => router.push(`/${locale}/datenschutz/auskunft`)}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#20b2aa]" />
                <span className="text-xs sm:text-sm font-semibold">Datenauskunft (Art. 15)</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500" />
            </CardContent>
          </Card>

          <Card
            className="bg-white/5 border-white/10 text-white shadow-md hover:bg-white/[0.08] transition-all cursor-pointer"
            onClick={() => router.push(`/${locale}/datenschutz/loeschen`)}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-rose-400" />
                <span className="text-xs sm:text-sm font-semibold">Daten löschen (Art. 17)</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500" />
            </CardContent>
          </Card>
        </div>

        {/* Verantwortlicher */}
        <Card className="bg-white/5 border-white/10 text-white shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-white">
              <User className="w-4 h-4 text-[#20b2aa]" /> Verantwortliche Stelle
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-300 space-y-1">
            <p className="font-bold text-white">PflegeNavigator EU gUG (haftungsbeschränkt)</p>
            <p>Heeper Straße 205, 33607 Bielefeld</p>
            <p className="flex items-center gap-1.5 pt-2">
              <Mail className="w-3.5 h-3.5 text-[#20b2aa]" />
              <a
                href="mailto:datenschutz@pflegenavigatoreu.com"
                className="text-[#20b2aa] hover:underline"
              >
                datenschutz@pflegenavigatoreu.com
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Datenkatalog */}
        <Card className="bg-white/5 border-white/10 text-white shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-white">
              <Eye className="w-4 h-4 text-[#20b2aa]" /> Erfasste Datenkategorien
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-gray-300">
            <div className="bg-slate-950/40 border border-white/5 p-4 rounded-xl">
              <p className="font-bold text-white mb-2">
                Bei Nutzung des digitalen Pflegegrad-Rechners:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li>Modul-Rohpunkte zur formalen Grad-Ermittlung</li>
                <li>Anonymisierte Antwortstrukturen ohne Personenbezug</li>
                <li>System-Zeitstempel und generierter Case-Code</li>
              </ul>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-400">
              <p className="font-bold mb-1">Strikter Ausschluss:</p>
              <p className="text-gray-300">
                Es werden ohne Ihre explizite Freigabe im Rechner-Trichter keine Namen,
                Versicherungsnummern oder Klarschriften verarbeitet.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Server Location */}
        <Card className="bg-white/5 border-white/10 text-white shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-white">
              <Server className="w-4 h-4 text-[#20b2aa]" /> Serverstandorte
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-300 space-y-2">
            <p>
              Die Verarbeitung erfolgt auf Servern der Supabase Inc. am geschützten deutschen
              Netzknoten-Standort (AWS Frankfurt Registry), vollständig isoliert vom
              US-Mutterkonzern (EU-Data-Boundary-Standard).
            </p>
          </CardContent>
        </Card>

        {/* Reichweitenmessung */}
        <Card className="bg-white/5 border-white/10 text-white shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-white">
              <BarChart3 className="w-4 h-4 text-[#20b2aa]" /> Reichweitenmessung (Umami)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-300 space-y-3">
            <p>
              <span className="font-bold text-white">Zweck:</span> Wir werten anonym aus, wie unsere
              Seiten genutzt werden, um Verständlichkeit und Ablauf zu verbessern.
            </p>
            <p>
              <span className="font-bold text-white">Rechtsgrundlage:</span> Ihre Einwilligung nach
              Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TTDSG. Ohne Ihre Zustimmung wird kein
              Analyse-Skript geladen und keine Verbindung zum Analyse-Dienst aufgebaut.
            </p>
            <p>
              <span className="font-bold text-white">Anbieter und Ort:</span> Umami, betrieben in
              der EU-Region. Es werden keine Cookies gesetzt und keine geräteübergreifenden Profile
              gebildet.
            </p>
            <div className="bg-slate-950/40 border border-white/5 p-4 rounded-xl">
              <p className="font-bold text-white mb-2">Erfasst werden ausschließlich:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li>Der aufgerufene Seitenpfad — ohne Parameter, also ohne Ihren Fallcode</li>
                <li>Verweisende Seite, grobe Herkunftsregion, Browser- und Gerätetyp</li>
                <li>
                  Drei Ereignisse ohne Personenbezug: Rechner gestartet, Checkout aufgerufen, Kauf
                  erfolgreich
                </li>
              </ul>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
              <p className="font-bold text-emerald-400 mb-1">Ihr Widerrufsrecht:</p>
              <p className="text-gray-300 mb-3">
                Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen. Die
                Erfassung endet sofort — nicht erst beim nächsten Seitenaufruf.
              </p>
              <CookieEinstellungenButton className="inline-flex items-center justify-center h-11 px-5 rounded-xl bg-[#20b2aa] text-slate-950 text-xs font-bold hover:bg-[#3ddbd0] transition-colors">
                Cookie-Einstellungen ändern
              </CookieEinstellungenButton>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => router.push(`/${locale}`)}
            className="text-gray-400 hover:text-white hover:bg-white/5 h-11 px-6 rounded-xl"
          >
            <ArrowLeft className="mr-2 w-4 h-4" /> Zurück zur Startseite
          </Button>
        </div>
      </div>
    </div>
  );
}
