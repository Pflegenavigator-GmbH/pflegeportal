// src/app/[locale]/pflegegrad/modul6/page.tsx
'use client';

import { Shield, ArrowRight, ArrowLeft, Home, AlertCircle, Info } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import {
  AlltagsFrage,
  AlltagsgestaltungForm,
} from '@/src/app/[locale]/pflegegrad/modul6/_component/AlltagsgestaltungForm';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/src/components/ui/card';
import { Progress } from '@/src/components/ui/progress';
import { logger } from '@/src/lib/logger';
import {
  loadModuleAnswers,
  saveModuleAnswers,
  SessionExpiredError,
} from '@/src/lib/pflegegrad/client-api';

const ALLTAGS_FRAGEN: AlltagsFrage[] = [
  {
    id: 'm6_q1',
    key: 'haushalt',
    text: '1. Wer erledigt die hauswirtschaftliche Versorgung (Putzen, Wäsche)?',
    optionen: [
      {
        value: 'selbst',
        title: 'Die betroffene Person allein',
        sub: 'Erledigt sämtliche Reinigungsarbeiten selbstständig.',
      },
      {
        value: 'teilweise',
        title: 'Mit regelmäßiger Unterstützung',
        sub: 'Leichte Arbeiten eigenständig, schwere Arbeiten (z.B. Gardinen, Saugen) mit Hilfe.',
      },
      {
        value: 'nicht',
        title: 'Vollständige Übernahme durch andere',
        sub: 'Der Haushalt wird komplett durch Angehörige oder Dienste geführt.',
      },
    ],
  },
  {
    id: 'm6_q2',
    key: 'einkaufen',
    text: '2. Wie selbstständig können Einkäufe des täglichen Bedarfs erledigt werden?',
    optionen: [
      {
        value: 'ja',
        title: 'Vollständig selbstständig',
        sub: 'Sucht Geschäfte eigenständig auf und transportiert Waren nach Hause.',
      },
      {
        value: 'online_begleitung',
        title: 'Nur mit Begleitung oder digital',
        sub: 'Benötigt Unterstützung beim Tragen oder Begleitung zum Geschäft.',
      },
      {
        value: 'nicht',
        title: 'Nicht mehr eigenständig möglich',
        sub: 'Besorgungen werden vollständig von Dritten übernommen.',
      },
    ],
  },
  {
    id: 'm6_q3',
    key: 'kochen',
    text: '3. Kann die Zubereitung von warmen und kalten Mahlzeiten sichergestellt werden?',
    optionen: [
      {
        value: 'selbst',
        title: 'Ja, vollkommen autark',
        sub: 'Plant, kocht, bereitet zu und reinigt die Küche eigenständig.',
      },
      {
        value: 'teilweise',
        title: 'Mit punktueller Unterstützung',
        sub: 'Hilfe beim Schneiden/Heben schwerer Töpfe oder Strukturierung nötig.',
      },
      {
        value: 'nicht',
        title: 'Vollständige Fremdversorgung',
        sub: 'Mahlzeiten müssen fertig zubereitet oder geliefert werden (Essen auf Rädern).',
      },
    ],
  },
  {
    id: 'm6_q4',
    key: 'finanzen',
    text: '4. Werden finanzielle Angelegenheiten und Behördengänge bewältigt?',
    optionen: [
      {
        value: 'voll',
        title: 'Vollständig eigenständig',
        sub: 'Regelt Überweisungen, Verträge, Bargeld und Postverkehr fehlerfrei.',
      },
      {
        value: 'teilweise',
        title: 'Mit beratender Unterstützung',
        sub: 'Braucht Hilfe bei komplexen Formularen oder Überwachung von Fristen.',
      },
      {
        value: 'nicht',
        title: 'Vollständige Vertretung erforderlich',
        sub: 'Angelegenheiten werden per Vollmacht komplett abgegeben.',
      },
    ],
  },
  {
    id: 'm6_q5',
    key: 'entscheidungen',
    text: '5. Können zukunftsrelevante Entscheidungen gefällt werden?',
    optionen: [
      {
        value: 'selbst',
        title: 'Ja, vollkommen eigenverantwortlich',
        sub: 'Trifft medizinische und organisatorische Entscheidungen sicher selbst.',
      },
      {
        value: 'beratung',
        title: 'Nur nach eingehender Beratung',
        sub: 'Wägt Optionen mit Angehörigen ab, entscheidet im Kern jedoch selbst.',
      },
      {
        value: 'nicht',
        title: 'Nicht allein möglich',
        sub: 'Benötigt eine rechtliche Betreuung oder umfassende Entscheidungshilfe.',
      },
    ],
  },
];

export default function Modul6Page() {
  const router = useRouter();
  const { locale } = useParams();

  const [hasMounted, setHasMounted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const caseCode = typeof window !== 'undefined' ? localStorage.getItem('case_code') : null;

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasMounted(true);
    }, 0);

    if (!caseCode) {
      toast.error('Keine aktive Fall-Session gefunden. Bitte starten Sie neu.');
      router.push(`/${locale}/pflegegrad/start`);
      return () => clearTimeout(timer);
    }

    loadModuleAnswers(caseCode, 'modul6')
      .then((moduleAnswers) => {
        if (moduleAnswers) {
          setAnswers(moduleAnswers);
          logger.debug({ caseCode }, 'Bestehende Antworten für Modul 6 geladen.');
        }
      })
      .catch((err) => {
        if (err instanceof SessionExpiredError) {
          toast.error('Ihre Fall-Session ist abgelaufen. Bitte laden Sie Ihren Fall erneut.');
          router.push(`/${locale}/pflegegrad/start`);
          return;
        }
        logger.info('Keine alten Antworten für Modul 6 gefunden.');
      });

    return () => clearTimeout(timer);
  }, [caseCode, locale, router]);

  const handleAnswerChange = (questionKey: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionKey]: value }));
  };

  const isComplete = ALLTAGS_FRAGEN.every(
    (f) => answers[f.key] !== undefined && answers[f.key] !== null && answers[f.key] !== ''
  );

  const handleSaveAndNext = async () => {
    if (!isComplete || !caseCode) return;
    setSaving(true);

    try {
      await saveModuleAnswers(caseCode, 'modul6', answers);

      localStorage.setItem('modul6_answers', JSON.stringify(answers));
      toast.success('Alltags-Profil vollständig erfasst!');
      router.push(`/${locale}/pflegegrad/ergebnis`);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        toast.error('Ihre Fall-Session ist abgelaufen. Bitte laden Sie Ihren Fall erneut.');
        router.push(`/${locale}/pflegegrad/start`);
        return;
      }
      logger.error({ err }, 'Fehler beim Sichern von Modul 6');
      toast.error(
        'Speichern fehlgeschlagen. Ihre Eingaben bleiben erhalten — bitte erneut versuchen.'
      );
    } finally {
      setSaving(false);
    }
  };

  const fortschritt =
    (ALLTAGS_FRAGEN.filter((f) => answers[f.key]).length / ALLTAGS_FRAGEN.length) * 100;

  // Render-Guard gegen unvollständige Server-Rumpfdaten
  if (!hasMounted) return null;

  return (
    <main className="min-h-screen bg-slate-900 py-12 px-4 text-white">
      <div className="container mx-auto max-w-2xl font-sans">
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-xs text-gray-400 font-medium">
            <span>Abschluss-Modul 6 von 6</span>
            <span>Alltagsgestaltung & Vorsorge</span>
          </div>
          <Progress value={fortschritt} className="h-2 bg-white/5" />
        </div>

        <button
          disabled={saving}
          onClick={() => router.push(`/${locale}/pflegegrad/modul5`)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors text-sm font-medium disabled:opacity-40"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zurück zu Modul 5</span>
        </button>

        <Card className="bg-white/5 border-white/10 text-white shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                  <Home className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white">Modul 6: Alltagsgestaltung</CardTitle>
                  <CardDescription className="text-gray-400">
                    Rechtlicher Kontext: SGB XI Widerspruchs-Sicherung
                  </CardDescription>
                </div>
              </div>
              {caseCode && (
                <span className="text-xs font-mono bg-white/5 border border-white/10 px-3 py-1 rounded-full text-gray-400">
                  {caseCode}
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 items-start">
              <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-300 leading-relaxed">
                <strong>Widerspruchs-Relevanz:</strong> Dieses Modul verändert die mathematischen
                Systempunkte nicht direkt, bildet aber die rechtliche Argumentationsbasis, falls der
                Medizinische Dienst die Pflegesituation unvollständig erfasst hat.
              </p>
            </div>

            <AlltagsgestaltungForm
              fragen={ALLTAGS_FRAGEN}
              antworten={answers}
              onAntwort={handleAnswerChange}
            />

            <div className="p-4 bg-slate-800/40 border border-white/5 rounded-xl flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400 leading-relaxed">
                Mit dem Klick auf Auswertung starten werden Ihre Daten nach den Richtlinien des SGB
                XI berechnet und mit den länderspezifischen Entlastungsbeträgen abgeglichen.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex gap-4 border-t border-white/10 pt-6">
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => router.push(`/${locale}/pflegegrad/modul5`)}
              className="flex-1 border-white/10 text-white hover:bg-white/5 h-14 text-base"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Zurück
            </Button>
            <Button
              onClick={handleSaveAndNext}
              disabled={!isComplete || saving}
              className="flex-1 bg-[#20b2aa] hover:bg-[#3ddbd0] text-white font-bold h-14 text-base shadow-xl disabled:opacity-40"
            >
              {saving ? 'Berechne Matrix...' : 'Auswertung starten'}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>

        <footer className="mt-8 pt-6 border-t border-white/10 flex items-start gap-3 text-gray-500 text-xs leading-relaxed">
          <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            © 2026 PflegeNavigator EU gUG • Alle Berechnungen basieren auf den gesetzlichen
            Schwellenwerten des Bundesministeriums für Gesundheit.
          </p>
        </footer>
      </div>
    </main>
  );
}
