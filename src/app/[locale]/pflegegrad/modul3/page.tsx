// src/app/[locale]/pflegegrad/modul3/page.tsx
'use client';

import { Heart } from 'lucide-react';

import { useAssessmentModule } from '@/src/hooks/useAssessmentModule';
import { BewertungOption, Frage } from '@/src/types/pflegegrad';

import { AssessmentModuleShell } from '../_components/AssessmentModuleShell';
import { AssessmentQuestionForm } from '../_components/AssessmentQuestionForm';

// Offizielle NBA-Kriterien für Modul 3 nach § 15 SGB XI
const VERHALTEN_FRAGEN: Frage[] = [
  {
    id: 'm3_1',
    text: 'Motorisch geprägte Verhaltensweisen',
    hilfe: 'Z.B. zielloses Herumlaufen, Aufstehen und Niedersetzen, Weglauf-Tendenzen.',
  },
  {
    id: 'm3_2',
    text: 'Nächtliche Unruhe',
    hilfe: 'Wird der Tag-Nacht-Rhythmus gestört? Gibt es nächtliches Umherwandern oder Rufen?',
  },
  {
    id: 'm3_3',
    text: 'Selbstschädigendes und autoaggressives Verhalten',
    hilfe: 'Z.B. Kratzen, Schlagen gegen Gegenstände, Verweigerung von Nahrung/Flüssigkeit.',
  },
  {
    id: 'm3_4',
    text: 'Abwehr von pflegerischen Maßnahmen',
    hilfe: 'Gibt es verbalen oder physischen Widerstand bei der Körperpflege oder beim Ankleiden?',
  },
];

// Offizielle gesetzliche NBA-Bewertungsskala für Verhaltensweisen (§ 15 SGB XI)
const BEWERTUNG_OPTIONEN: BewertungOption[] = [
  { value: '0', label: 'Nie oder sehr selten', punkte: 0 },
  { value: '1', label: 'Selten (ein- bis mehrmals wöchentlich)', punkte: 1 },
  { value: '3', label: 'Häufig (täglich oder mehrfach täglich)', punkte: 3 },
];

export default function Modul3Page() {
  const m = useAssessmentModule({
    moduleName: 'modul3',
    questionKeys: VERHALTEN_FRAGEN.map((f) => f.id),
    next: (l) => `/${l}/pflegegrad/modul4`,
  });

  if (!m.hasMounted) return null;

  return (
    <AssessmentModuleShell
      title="Modul 3: Verhaltensweisen & Psyche"
      weightLabel="Gewichtung: 15% (Vergleichs-Fusing mit Modul 2)"
      icon={Heart}
      accentColor="#ec4899"
      caseCode={m.caseCode}
      fortschritt={m.fortschritt}
      backHref={`/${m.locale}/pflegegrad/modul2`}
      backLabel="Zurück zu Modul 2"
      nextLabel="Weiter zu Modul 4"
      loading={m.loading}
      canProceed={m.alleBeantwortet}
      onNext={m.speichernUndWeiter}
      legalStrong="Wichtiger rechtlicher Hinweis:"
      legalText="Die im Modul 3 erfassten Kriterien spiegeln psychische Problemlagen wider. Sie fließen über das Höchstwert-Prinzip direkt in die Ermittlung des Pflegegrads ein."
    >
      <AssessmentQuestionForm
        fragen={VERHALTEN_FRAGEN}
        optionen={BEWERTUNG_OPTIONEN}
        antworten={m.antworten}
        onAntwort={m.setAntwort}
        icon={Heart}
      />
    </AssessmentModuleShell>
  );
}
