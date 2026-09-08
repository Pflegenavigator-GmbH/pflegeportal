// src/app/[locale]/pflegegrad/modul1/page.tsx
'use client';

import { Accessibility } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { useAssessmentModule } from '@/src/hooks/useAssessmentModule';
import { useBewertungen } from '@/src/hooks/useBewertungen';
import { FRAGEN_MODUL_1_IDS } from '@/src/lib/pflegegrad/fragen';

import { AssessmentModuleShell } from '../_components/AssessmentModuleShell';
import { AssessmentQuestionForm } from '../_components/AssessmentQuestionForm';

export default function Modul1Page() {
  const t = useTranslations('pflegegrad.modules.modul1');
  const optionen = useBewertungen();

  const m = useAssessmentModule({
    moduleName: 'modul1',
    questionKeys: [...FRAGEN_MODUL_1_IDS],
    next: (l) => `/${l}/pflegegrad/modul2`,
  });

  // Die IDs sind fachlich, die Texte kommen aus den Übersetzungen. Dank
  // `as const` prüft TypeScript die zusammengesetzten Schlüssel mit.
  const fragen = useMemo(
    () =>
      FRAGEN_MODUL_1_IDS.map((id) => ({
        id,
        text: t(`questions.${id}.label`),
        hilfe: t(`questions.${id}.hilfe`),
      })),
    [t]
  );

  if (!m.hasMounted) return null;

  return (
    <AssessmentModuleShell
      title={t('title')}
      weightLabel={t('weight')}
      icon={Accessibility}
      accentColor="#4a90e2"
      caseCode={m.caseCode}
      fortschritt={m.fortschritt}
      backHref={`/${m.locale}/pflegegrad/start`}
      backLabel={t('zurueck')}
      nextLabel={t('weiter')}
      loading={m.loading}
      canProceed={m.alleBeantwortet}
      onNext={m.speichernUndWeiter}
    >
      <AssessmentQuestionForm
        fragen={fragen}
        optionen={optionen}
        antworten={m.antworten}
        onAntwort={m.setAntwort}
        icon={Accessibility}
      />
    </AssessmentModuleShell>
  );
}
