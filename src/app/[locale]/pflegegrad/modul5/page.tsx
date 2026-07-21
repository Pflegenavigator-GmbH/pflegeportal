// src/app/[locale]/pflegegrad/modul5/page.tsx
'use client';

import { HeartPulse } from 'lucide-react';

import { useAssessmentModule } from '@/src/hooks/useAssessmentModule';
import { BewertungOption, Frage } from '@/src/types/pflegegrad';

import { AssessmentModuleShell } from '../_components/AssessmentModuleShell';
import { AssessmentQuestionForm } from '../_components/AssessmentQuestionForm';

const KRANKHEIT_FRAGEN: Frage[] = [
  {
    id: 'm5_1',
    text: 'Medikation',
    hilfe:
      'Können Medikamente rechtzeitig, in der richtigen Dosierung und selbstständig eingenommen werden?',
  },
  {
    id: 'm5_2',
    text: 'Injektionen, Infusionen, Absaugen',
    hilfe:
      'Können medizinische Maßnahmen (z.B. Insulinspritzen oder Messungen) eigenständig durchgeführt werden?',
  },
  {
    id: 'm5_3',
    text: 'Arzt- und Therapiebesuche',
    hilfe: 'Können Termine koordiniert und der Weg zur Praxis eigenständig bewältigt werden?',
  },
  {
    id: 'm5_4',
    text: 'Einhaltung von Diäten und Einschränkungen',
    hilfe: 'Können verordnete Gesundheitsvorgaben im Alltag selbstständig eingehalten werden?',
  },
];

const BEWERTUNG_OPTIONEN: BewertungOption[] = [
  { value: '0', label: 'Selbstständig (Keine Hilfe notwendig)', punkte: 0 },
  { value: '1', label: 'Wöchentliche Unterstützung notwendig', punkte: 1 },
  { value: '2', label: 'Tägliche Unterstützung (1- bis 2-mal)', punkte: 2 },
  { value: '3', label: 'Mehrfach tägliche Unterstützung notwendig', punkte: 3 },
];

export default function Modul5Page() {
  const m = useAssessmentModule({
    moduleName: 'modul5',
    questionKeys: KRANKHEIT_FRAGEN.map((f) => f.id),
    next: (l) => `/${l}/pflegegrad/modul6`,
  });

  if (!m.hasMounted) return null;

  return (
    <AssessmentModuleShell
      title="Modul 5: Krankheitsbewältigung"
      weightLabel="Gewichtung: 20% – Eigenständigkeit bei therapeutischen Maßnahmen"
      weightAccent
      icon={HeartPulse}
      accentColor="#f43f5e"
      caseCode={m.caseCode}
      fortschritt={m.fortschritt}
      backHref={`/${m.locale}/pflegegrad/modul4`}
      backLabel="Zurück zu Modul 4"
      nextLabel="Weiter zu Modul 6"
      loading={m.loading}
      canProceed={m.alleBeantwortet}
      onNext={m.speichernUndWeiter}
      legalStrong="Wichtiger gesetzlicher Hinweis:"
      legalText="Ärztlich verordnete Maßnahmen (wie Medikamentengabe oder Kompressionsstrümpfe) mindern die Eigenständigkeit massiv, falls diese nicht mehr fehlerfrei allein durchgeführt werden können."
    >
      <AssessmentQuestionForm
        fragen={KRANKHEIT_FRAGEN}
        optionen={BEWERTUNG_OPTIONEN}
        antworten={m.antworten}
        onAntwort={m.setAntwort}
        icon={HeartPulse}
      />
    </AssessmentModuleShell>
  );
}
