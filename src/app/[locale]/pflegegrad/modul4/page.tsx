// src/app/[locale]/pflegegrad/modul4/page.tsx
'use client';

import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { useAssessmentModule } from '@/src/hooks/useAssessmentModule';
import { useBewertungen } from '@/src/hooks/useBewertungen';
import { FRAGEN_MODUL_4_IDS } from '@/src/lib/pflegegrad/fragen';

import { AssessmentModuleShell } from '../_components/AssessmentModuleShell';
import { AssessmentQuestionForm } from '../_components/AssessmentQuestionForm';

export default function Modul4Page() {
  const t = useTranslations('pflegegrad.modules.modul4');
  const optionen = useBewertungen();

  const m = useAssessmentModule({
    moduleName: 'modul4',
    questionKeys: [...FRAGEN_MODUL_4_IDS],
    next: (l) => `/${l}/pflegegrad/modul5`,
  });

  // IDs sind fachlich, Texte kommen aus den Übersetzungen.
  const fragen = useMemo(
    () =>
      FRAGEN_MODUL_4_IDS.map((id) => ({
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
      icon={Sparkles}
      accentColor="#10b981"
      caseCode={m.caseCode}
      fortschritt={m.fortschritt}
      backHref={`/${m.locale}/pflegegrad/modul3`}
      backLabel={t('zurueck')}
      nextLabel={t('weiter')}
      loading={m.loading}
      canProceed={m.alleBeantwortet}
      onNext={m.speichernUndWeiter}
      legalStrong="Wichtiger gesetzlicher Hinweis:"
      legalText="Die Selbstversorgung bildet das Fundament der Pflegeeinstufung. Fehlerhafte Angaben in diesem Modul führen in der Praxis zu über 80 % aller fehlerhaften Bescheide durch die Pflegekassen."
    >
      <AssessmentQuestionForm
        fragen={fragen}
        optionen={optionen}
        antworten={m.antworten}
        onAntwort={m.setAntwort}
        icon={Sparkles}
      />
    </AssessmentModuleShell>
  );
}
