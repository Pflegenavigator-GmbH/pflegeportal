// src/app/[locale]/pflegegrad/modul1/page.tsx
'use client';

import { Accessibility } from 'lucide-react';

import { useAssessmentModule } from '@/src/hooks/useAssessmentModule';
import { FRAGEN_MODUL_1, BEWERTUNGEN } from '@/src/lib/pflegegrad/fragen';

import { AssessmentModuleShell } from '../_components/AssessmentModuleShell';
import { AssessmentQuestionForm } from '../_components/AssessmentQuestionForm';

export default function Modul1Page() {
  const m = useAssessmentModule({
    moduleName: 'modul1',
    questionKeys: FRAGEN_MODUL_1.map((f) => f.id),
    next: (l) => `/${l}/pflegegrad/modul2`,
  });

  if (!m.hasMounted) return null;

  return (
    <AssessmentModuleShell
      title="Modul 1: Mobilität"
      weightLabel="Gewichtung im Gesamtverfahren: 10%"
      icon={Accessibility}
      accentColor="#4a90e2"
      caseCode={m.caseCode}
      fortschritt={m.fortschritt}
      backHref={`/${m.locale}/pflegegrad/start`}
      backLabel="Zurück zum Start"
      nextLabel="Weiter zu Modul 2"
      loading={m.loading}
      canProceed={m.alleBeantwortet}
      onNext={m.speichernUndWeiter}
    >
      <AssessmentQuestionForm
        fragen={FRAGEN_MODUL_1}
        optionen={BEWERTUNGEN}
        antworten={m.antworten}
        onAntwort={m.setAntwort}
        icon={Accessibility}
      />
    </AssessmentModuleShell>
  );
}
