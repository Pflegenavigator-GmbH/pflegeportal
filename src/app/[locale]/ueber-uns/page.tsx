'use client';

import {
  Heart,
  Globe,
  Shield,
  Clock,
  Users,
  Award,
  ArrowRight,
  CheckCircle2,
  Smartphone,
  FileText,
  MessageCircle,
  QrCode,
  Sparkles,
  Euro,
  Calculator,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use } from 'react';

import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/src/components/ui/card';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const funktionen = [
  {
    icon: Calculator,
    title: 'Pflegegrad-Rechner',
    description:
      'Berechnen Sie Ihren Pflegegrad in 6 einfachen Modulen. Basierend auf SGB XI und MDK-Kriterien.',
    highlight: '15 Minuten • 29€ Beta',
  },
  {
    icon: FileText,
    title: 'Widerspruchs-Generator',
    description:
      'Erstellen Sie professionelle Widerspruchsschreiben gegen Pflegegrad-Bescheide automatisch.',
    highlight: 'PDF-Download • Rechtssicher',
  },
  {
    icon: MessageCircle,
    title: 'Avatar-Chat mit Sprache',
    description:
      'Stellen Sie Fragen an unseren virtuellen Assistenten – per Text oder Spracheingabe.',
    highlight: 'Kokoro TTS • 35 Sprachen',
  },
  {
    icon: QrCode,
    title: 'QR-Code System',
    description: 'Teilen Sie Ihren Fall via QR-Code mit Angehörigen oder Pflegekräften.',
    highlight: 'Sofortiger Zugriff • Sicher',
  },
  {
    icon: Clock,
    title: 'Pflege-Tagebuch',
    description: 'Dokumentieren Sie Pflegeleistungen, Medikamente und Verläufe digital.',
    highlight: 'Chronologisch • Exportfähig',
  },
  {
    icon: Smartphone,
    title: 'Multi-Rechner',
    description: 'GdB-Rechner, SGB XIV-Rechner, Kombi-Rechner – alles in einem Portal.',
    highlight: 'Aktuelle Beträge 2026',
  },
];

const vorteile = [
  { icon: Shield, text: 'DSGVO-konform', subtext: 'EU-Server, keine Datenweitergabe' },
  { icon: Globe, text: '35 Sprachen', subtext: 'Inkl. Arabisch, Türkisch, Russisch' },
  { icon: Clock, text: '24/7 Verfügbar', subtext: 'Keine Wartezeiten' },
  { icon: Users, text: 'Für alle', subtext: 'Pflegebedürftige, Angehörige, Fachkräfte' },
  { icon: Award, text: 'Professionell', subtext: 'Aktuelle Gesetze & Beträge' },
  { icon: Euro, text: 'Fair gepreist', subtext: '29€ Beta, später Kassenleistung' },
];

export default function UeberPflegeNavigatorPage(props: PageProps) {
  const router = useRouter();
  const params = use(props.params);
  const locale = params?.locale || 'de';

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <section className="bg-[#0f2744] text-white py-20 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#20b2aa]/20 rounded-full text-[#20b2aa] text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" /> Innovation im Sozialrecht
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Was ist <span className="text-[#20b2aa]">PflegeNavigator</span> EU?
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            Ihr digitaler Wegweiser durch den Pflegegrad-Dschungel. Berechnen, dokumentieren,
            widersprechen – alles an einem Ort, in 35 Sprachen, DSGVO-konform.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              onClick={() => router.push(`/${locale}/pflegegrad/start`)}
              className="bg-[#20b2aa] hover:bg-[#1a9891]"
            >
              Jetzt Pflegegrad berechnen <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('#preis')}
              className="border-white/30 text-white hover:bg-white/10 hover:text-white"
            >
              Preise ansehen
            </Button>
          </div>
        </div>
      </section>

      {/* Restliche Sektionen aus deinem bereitgestellten Code (Funktionen, Vorteile, etc.) */}
      <section id="funktionen" className="py-16 px-4 bg-slate-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0f2744] mb-4">Was kann das Portal?</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {funktionen.map((fkt, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow group">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-[#0f2744] rounded-xl group-hover:bg-[#20b2aa] transition-colors">
                      <fkt.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-[#20b2aa] bg-[#20b2aa]/10 px-2 py-1 rounded-full">
                      {fkt.highlight}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{fkt.title}</CardTitle>
                  <CardDescription>{fkt.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
