// src/app/[locale]/pflegegrad/modul3/page.tsx
'use client';

import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { useAssessmentModule } from '@/src/hooks/useAssessmentModule';
import { useBewertungen } from '@/src/hooks/useBewertungen';
import { FRAGEN_MODUL_3_IDS } from '@/src/lib/pflegegrad/fragen';

import { AssessmentModuleShell } from '../_components/AssessmentModuleShell';
import { AssessmentQuestionForm } from '../_components/AssessmentQuestionForm';

// Offizielle gesetzliche NBA-Bewertungsskala für Verhaltensweisen (§ 15 SGB XI)
export default function Modul3Page() {
  const t = useTranslations('pflegegrad.modules.modul3');
  const optionen = useBewertungen();

  const m = useAssessmentModule({
    moduleName: 'modul3',
    questionKeys: [...FRAGEN_MODUL_3_IDS],
    next: (l) => `/${l}/pflegegrad/modul4`,
  });

  // IDs sind fachlich, Texte kommen aus den Übersetzungen.
  const fragen = useMemo(
    () =>
      FRAGEN_MODUL_3_IDS.map((id) => ({
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
      icon={Heart}
      accentColor="#ec4899"
      caseCode={m.caseCode}
      fortschritt={m.fortschritt}
      backHref={`/${m.locale}/pflegegrad/modul2`}
      backLabel={t('zurueck')}
      nextLabel={t('weiter')}
      loading={m.loading}
      canProceed={m.alleBeantwortet}
      onNext={m.speichernUndWeiter}
      legalStrong="Wichtiger rechtlicher Hinweis:"
      legalText="Die im Modul 3 erfassten Kriterien spiegeln psychische Problemlagen wider. Sie fließen über das Höchstwert-Prinzip direkt in die Ermittlung des Pflegegrads ein."
    >
      <AssessmentQuestionForm
        fragen={fragen}
        optionen={optionen}
        antworten={m.antworten}
        onAntwort={m.setAntwort}
        icon={Heart}
      />
    </AssessmentModuleShell>
  );
}
