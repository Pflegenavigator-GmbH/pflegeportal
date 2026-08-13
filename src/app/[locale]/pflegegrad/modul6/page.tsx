// src/app/[locale]/pflegegrad/modul6/page.tsx
'use client';

import { ArrowRight, ArrowLeft, Home, AlertCircle, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMessages, useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { AlltagsgestaltungForm } from '@/src/app/[locale]/pflegegrad/modul6/_component/AlltagsgestaltungForm';
import { RechtshinweisFuss } from '@/src/components/layout/SeitenFuss';
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

/**
 * Modul 6 hat je Frage eigene Optionen mit Titel und Erläuterung. Fachlich
 * fest sind nur die IDs und die Optionswerte — die Texte liegen in
 * `pflegegrad.modules.modul6.questions`.
 */
const ALLTAGS_STRUKTUR = [
  { id: 'm6_q1', key: 'haushalt', optionen: ['selbst', 'teilweise', 'nicht'] },
  { id: 'm6_q2', key: 'einkaufen', optionen: ['ja', 'online_begleitung', 'nicht'] },
  { id: 'm6_q3', key: 'kochen', optionen: ['selbst', 'teilweise', 'nicht'] },
  { id: 'm6_q4', key: 'finanzen', optionen: ['selbst', 'teilweise', 'nicht'] },
  { id: 'm6_q5', key: 'entscheidungen', optionen: ['selbst', 'beratung', 'betreuung'] },
] as const;

export default function Modul6Page() {
  const t = useTranslations('pflegegrad.modules.modul6');
  const nachrichten = useMessages();
  const router = useRouter();
  const m = useAssessmentModule({
    moduleName: 'modul6',
    questionKeys: ALLTAGS_STRUKTUR.map((f) => f.key),
    next: (l) => `/${l}/pflegegrad/ergebnis`,
  });

  const caseCode = m.caseCode;
  const answers = m.antworten;
  const saving = m.loading;
  const isComplete = m.alleBeantwortet;
  const fortschritt = m.fortschritt;

  // IDs und Optionswerte sind fachlich, die Texte kommen aus den Übersetzungen.
  //
  // Bewusst der Nachrichtenbaum statt einzelner t()-Aufrufe: Beim
  // Zusammensetzen von Frage-ID und Optionswert verliert TypeScript die
  // Zuordnung und bildet das Kreuzprodukt aller 45 Kombinationen — auch der
  // unmöglichen (Frage 1 hat kein „ja"). Die Form ist durch die deutsche
  // Datei festgelegt und wird von der Vollständigkeits-Prüfung überwacht.
  const fragenTexte = nachrichten.pflegegrad.modules.modul6.questions as unknown as Record<
    string,
    { label: string; optionen: Record<string, { titel: string; beschreibung: string }> }
  >;

  const fragen = useMemo(
    () =>
      ALLTAGS_STRUKTUR.map(({ id, key, optionen }) => ({
        id,
        key,
        text: fragenTexte[id].label,
        optionen: optionen.map((value) => ({
          value,
          title: fragenTexte[id].optionen[value].titel,
          sub: fragenTexte[id].optionen[value].beschreibung,
        })),
      })),
    [fragenTexte]
  );

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
          <span>{t('zurueck')}</span>
        </button>

        <Card className="bg-[var(--surface-1)] border-[var(--border-subtle)] text-white shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                  <Home className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white">{t('title')}</CardTitle>
                  <CardDescription className="text-[var(--color-text-muted)]">
                    {t('weight')}
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
                <strong>{t('widerspruchTitel')}</strong> {t('widerspruchText')}
              </p>
            </div>

            <AlltagsgestaltungForm fragen={fragen} antworten={answers} onAntwort={m.setAntwort} />

            <div className="p-4 bg-[var(--surface-1)] border border-[var(--border-faint)] rounded-xl flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-[var(--color-text-muted)] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                {t('auswertungHinweis')}
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
              {t('zurueckKurz')}
            </Button>
            <Button
              onClick={m.speichernUndWeiter}
              disabled={!isComplete || saving}
              className="flex-1 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-bold h-14 text-base shadow-xl disabled:opacity-40"
            >
              {saving ? t('berechnet') : t('auswertungStarten')}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>

        <RechtshinweisFuss>{t('fussnote')}</RechtshinweisFuss>
      </div>
    </main>
  );
}
