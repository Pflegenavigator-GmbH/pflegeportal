// src/app/[locale]/pflegegrad/modul2/page.tsx
'use client';

import { Brain } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { useAssessmentModule } from '@/src/hooks/useAssessmentModule';
import { useBewertungen } from '@/src/hooks/useBewertungen';
import { FRAGEN_MODUL_2_IDS } from '@/src/lib/pflegegrad/fragen';

import { AssessmentModuleShell } from '../_components/AssessmentModuleShell';
import { AssessmentQuestionForm } from '../_components/AssessmentQuestionForm';

export default function Modul2Page() {
  const t = useTranslations('pflegegrad.modules.modul2');
  const optionen = useBewertungen();

  const m = useAssessmentModule({
    moduleName: 'modul2',
    questionKeys: [...FRAGEN_MODUL_2_IDS],
    next: (l) => `/${l}/pflegegrad/modul3`,
  });

  // IDs sind fachlich, Texte kommen aus den Übersetzungen.
  const fragen = useMemo(
    () =>
      FRAGEN_MODUL_2_IDS.map((id) => ({
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
      icon={Brain}
      accentColor="#a855f7"
      caseCode={m.caseCode}
      fortschritt={m.fortschritt}
      backHref={`/${m.locale}/pflegegrad/modul1`}
      backLabel={t('zurueck')}
      nextLabel={t('weiter')}
      loading={m.loading}
      canProceed={m.alleBeantwortet}
      onNext={m.speichernUndWeiter}
      legalStrong="Wichtiger rechtlicher Hinweis:"
      legalText="Die im Modul 2 erfassten Kriterien basieren auf den offiziellen Richtlinien des Medizinischen Dienstes (MD) zur Feststellung von Pflegebedürftigkeit nach dem SGB XI."
    >
      <AssessmentQuestionForm
        fragen={fragen}
        optionen={optionen}
        antworten={m.antworten}
        onAntwort={m.setAntwort}
        icon={Brain}
      />
    </AssessmentModuleShell>
  );
}
