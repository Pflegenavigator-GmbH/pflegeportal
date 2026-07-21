// src/app/[locale]/pflegegrad/modul6/page.tsx
'use client';

import { Shield, ArrowRight, ArrowLeft, Home, AlertCircle, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  AlltagsFrage,
  AlltagsgestaltungForm,
} from '@/src/app/[locale]/pflegegrad/modul6/_component/AlltagsgestaltungForm';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Progress,
} from '@/src/components/ui';
import { useAssessmentModule } from '@/src/hooks/useAssessmentModule';

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
  const m = useAssessmentModule({
    moduleName: 'modul6',
    questionKeys: ALLTAGS_FRAGEN.map((f) => f.key),
    next: (l) => `/${l}/pflegegrad/ergebnis`,
  });

  const caseCode = m.caseCode;
  const answers = m.antworten;
  const saving = m.loading;
  const isComplete = m.alleBeantwortet;
  const fortschritt = m.fortschritt;

  // Render-Guard gegen unvollständige Server-Rumpfdaten
  if (!m.hasMounted) return null;

  return (
    <main className="min-h-screen bg-[var(--color-surface)] py-12 px-4 text-white">
      <div className="container mx-auto max-w-2xl font-sans">
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-xs text-[var(--color-text-muted)] font-medium">
            <span>Abschluss-Modul 6 von 6</span>
            <span>Alltagsgestaltung & Vorsorge</span>
          </div>
          <Progress value={fortschritt} className="h-2 bg-[var(--surface-1)]" />
        </div>

        <button
          disabled={saving}
          onClick={() => router.push(`/${m.locale}/pflegegrad/modul5`)}
          className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-white mb-6 transition-colors text-sm font-medium disabled:opacity-40"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zurück zu Modul 5</span>
        </button>

        <Card className="bg-[var(--surface-1)] border-[var(--border-subtle)] text-white shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                  <Home className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white">Modul 6: Alltagsgestaltung</CardTitle>
                  <CardDescription className="text-[var(--color-text-muted)]">
                    Rechtlicher Kontext: SGB XI Widerspruchs-Sicherung
                  </CardDescription>
                </div>
              </div>
              {caseCode && (
                <span className="text-xs font-mono bg-[var(--surface-1)] border border-[var(--border-subtle)] px-3 py-1 rounded-full text-[var(--color-text-muted)]">
                  {caseCode}
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 items-start">
              <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--color-text-subtle)] leading-relaxed">
                <strong>Widerspruchs-Relevanz:</strong> Dieses Modul verändert die mathematischen
                Systempunkte nicht direkt, bildet aber die rechtliche Argumentationsbasis, falls der
                Medizinische Dienst die Pflegesituation unvollständig erfasst hat.
              </p>
            </div>

            <AlltagsgestaltungForm
              fragen={ALLTAGS_FRAGEN}
              antworten={answers}
              onAntwort={m.setAntwort}
            />

            <div className="p-4 bg-[var(--surface-1)] border border-[var(--border-faint)] rounded-xl flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-[var(--color-text-muted)] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Mit dem Klick auf Auswertung starten werden Ihre Daten nach den Richtlinien des SGB
                XI berechnet und mit den länderspezifischen Entlastungsbeträgen abgeglichen.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex gap-4 border-t border-[var(--border-subtle)] pt-6">
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => router.push(`/${m.locale}/pflegegrad/modul5`)}
              className="flex-1 border-[var(--border-subtle)] text-white hover:bg-[var(--surface-1)] h-14 text-base"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Zurück
            </Button>
            <Button
              onClick={m.speichernUndWeiter}
              disabled={!isComplete || saving}
              className="flex-1 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-bold h-14 text-base shadow-xl disabled:opacity-40"
            >
              {saving ? 'Berechne Matrix...' : 'Auswertung starten'}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>

        <footer className="mt-8 pt-6 border-t border-[var(--border-subtle)] flex items-start gap-3 text-[var(--color-text-faint)] text-xs leading-relaxed">
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
