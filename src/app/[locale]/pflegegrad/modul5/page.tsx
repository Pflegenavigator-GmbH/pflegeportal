// src/app/[locale]/pflegegrad/modul5/page.tsx
'use client';

import { HeartPulse } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { useAssessmentModule } from '@/src/hooks/useAssessmentModule';
import { useBewertungen } from '@/src/hooks/useBewertungen';
import { FRAGEN_MODUL_5_IDS } from '@/src/lib/pflegegrad/fragen';

import { AssessmentModuleShell } from '../_components/AssessmentModuleShell';
import { AssessmentQuestionForm } from '../_components/AssessmentQuestionForm';

export default function Modul5Page() {
  const t = useTranslations('pflegegrad.modules.modul5');
  const optionen = useBewertungen();

  const m = useAssessmentModule({
    moduleName: 'modul5',
    questionKeys: [...FRAGEN_MODUL_5_IDS],
    next: (l) => `/${l}/pflegegrad/modul6`,
  });

  // IDs sind fachlich, Texte kommen aus den Übersetzungen.
  const fragen = useMemo(
    () =>
      FRAGEN_MODUL_5_IDS.map((id) => ({
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
      weightAccent
      icon={HeartPulse}
      accentColor="#f43f5e"
      caseCode={m.caseCode}
      fortschritt={m.fortschritt}
      backHref={`/${m.locale}/pflegegrad/modul4`}
      backLabel={t('zurueck')}
      nextLabel={t('weiter')}
      loading={m.loading}
      canProceed={m.alleBeantwortet}
      onNext={m.speichernUndWeiter}
      legalStrong="Wichtiger gesetzlicher Hinweis:"
      legalText="Ärztlich verordnete Maßnahmen (wie Medikamentengabe oder Kompressionsstrümpfe) mindern die Eigenständigkeit massiv, falls diese nicht mehr fehlerfrei allein durchgeführt werden können."
    >
      <AssessmentQuestionForm
        fragen={fragen}
        optionen={optionen}
        antworten={m.antworten}
        onAntwort={m.setAntwort}
        icon={HeartPulse}
      />
    </AssessmentModuleShell>
  );
}
