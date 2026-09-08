import {
  ArrowLeft,
  Euro,
  HelpCircle,
  Hourglass,
  Scale,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import Link from 'next/link';

import { Sprachhinweis } from '@/src/components/rechtliches/Sprachhinweis';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'AGB - Allgemeine Geschäftsbedingungen - PflegeNavigator EU',
  description: 'Allgemeine Geschäftsbedingungen der PflegeNavigator EU gUG',
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AgbPage(props: PageProps) {
  const { locale } = await props.params;

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <Sprachhinweis />
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#0f2744] to-[#20b2aa] rounded-2xl shadow-xl border border-white/10">
            <Scale className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Allgemeine Geschäftsbedingungen
          </h1>
          <p className="text-gray-400 text-sm">Stand: April 2026 — PflegeNavigator EU gUG</p>
        </div>

        {/* § 1 Geltungsbereich */}
        <Card className="bg-white/5 border-white/10 text-white shadow-xl">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-white">
              <ShieldCheck className="w-5 h-5 text-[#20b2aa]" />§ 1 Geltungsbereich &
              Vertragsgegenstand
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-3 text-xs sm:text-sm text-gray-300 leading-relaxed">
            <p>
              (1) Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge und
              Nutzungen der digitalen Anwendungen zwischen der{' '}
              <strong>PflegeNavigator EU gUG (haftungsbeschränkt)</strong>, Heeper Straße 205, 33607
              Bielefeld (nachfolgend „Anbieter“) und den Nutzern des Portals.
            </p>
            <p>
              (2) Der Anbieter stellt ein digitales Assistenzsystem zur unverbindlichen
              Pflegegrad-Einschätzung, Fristenberechnung sowie Dokumentenerstellung (z. B.
              Widerspruchsschreiben) im Rahmen einer Web-Anwendung (PWA) zur Verfügung.
            </p>
          </CardContent>
        </Card>

        {/* § 2 Beta-Phase & Zahlungsabwicklung */}
        <Card className="bg-white/5 border-white/10 text-white shadow-xl">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-white">
              <ShoppingBag className="w-5 h-5 text-[#20b2aa]" />§ 2 Vertragsschluss, Tarife &
              Stripe-Zahlung
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-3 text-xs sm:text-sm text-gray-300 leading-relaxed">
            <p>
              (1) Die Nutzung der grundlegenden Informationsstrukturen ist kostenfrei. Die
              Freischaltung des vollständigen PDF-Exports und der automatisierten
              Widerspruchserstellung erfordert den Abschluss eines kostenpflichtigen Zugangs.
            </p>
            <p>
              (2) Während der aktuellen <strong>MVP- und Beta-Testphase (Stand 2026)</strong> wird
              ein zeitlich begrenzter Zugang (z.B. Beta-Special) als einmaliger In-App-Kauf
              angeboten. Ein Abonnement-Zwang besteht in diesem Tarif ausdrücklich nicht.
            </p>
            <p>
              (3) Die Zahlungsabwicklung erfolgt über den zertifizierten PCI-DSS-konformen
              Zahlungsdienstleister <strong>Stripe</strong>. Der Vertrag kommt mit erfolgreicher
              Autorisierung der Zahlung und Bereitstellung des digitalen Freischalt-Codes
              (Case-Code) zustande.
            </p>
          </CardContent>
        </Card>

        {/* § 3 Ausblick DiPA Zulassung */}
        <Card className="border-[#20b2aa]/30 bg-[#20b2aa]/5 text-white shadow-xl">
          <CardHeader className="border-b border-[#20b2aa]/10">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-[#20b2aa]">
              <Euro className="w-5 h-5" />§ 3 Erstattung via Pflegekasse (§ 40a SGB XI)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs text-gray-300 leading-relaxed">
            <p>
              (1) Der Anbieter weist darauf hin, dass die Zulassung als **Digitale Pflegeanwendung
              (DiPA)** nach § 40a SGB XI beim Bundesinstitut für Arzneimittel und Medizinprodukte
              (BfArM) beantragt ist.
            </p>
            <p>
              (2) Nach erfolgreicher offizieller Listung im DiPA-Verzeichnis haben Pflegebedürftige
              der Pflegegrade 1 bis 5 einen gesetzlichen Anspruch auf vollständige Kostenübernahme
              durch die zuständige Pflegekasse (bis zu 40,00 EUR monatlich für die Anwendung zzgl.
              gesetzlicher Zuschläge für ergänzende Unterstützungsleistungen). Bis zur finalen
              Listung gilt die vereinbarte Beta-Tarifstruktur nach § 2 dieser AGB.
            </p>
          </CardContent>
        </Card>

        {/* § 4 Leistungsgrenzen */}
        <Card className="bg-white/5 border-white/10 text-white shadow-xl">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-white">
              <HelpCircle className="w-5 h-5 text-[#20b2aa]" />§ 4 Leistungsgrenzen & Medizinischer
              Haftungsausschluss
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-3 text-xs sm:text-sm text-gray-300 leading-relaxed">
            <p>
              (1) Der PflegeNavigator EU bietet **keine Rechtsberatung** im Sinne des
              Rechtsdienstleistungsgesetzes (RDG) und **keine medizinische oder pflegefachliche
              Diagnose**.
            </p>
            <p>
              (2) Die mathematisch ermittelten Punktwerte und Ampel-Fristen beruhen auf den Angaben
              des Nutzers sowie den Richtlinien des MDK (NBA-Punktesystem). Sie stellen eine
              Orientierungshilfe dar. Die rechtsverbindliche Feststellung eines Pflegegrades obliegt
              ausschließlich dem Medizinischen Dienst und der zuständigen Pflegekasse.
            </p>
          </CardContent>
        </Card>

        {/* § 5 Widerrufsrecht */}
        <Card className="bg-white/5 border-white/10 text-white shadow-xl">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-white">
              <Hourglass className="w-4 h-4 text-[#20b2aa]" /> § 5 Vorzeitiges Erlöschen des
              Widerrufsrechts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 text-xs text-gray-300 leading-relaxed">
            <p>
              Bei Verträgen über digitale Inhalte, die nicht auf einem körperlichen Datenträger
              geliefert werden, erlischt das Widerrufsrecht vorzeitig, wenn der Nutzer ausdrücklich
              zugestimmt hat, dass der Anbieter mit der Ausführung des Vertrags vor Ablauf der
              Widerrufsfrist beginnt, und der Nutzer seine Kenntnis davon bestätigt hat, dass er
              durch seine Zustimmung sein Widerrufsrecht verliert (mit Generierung/Druck des
              PDF-Dossiers).
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
