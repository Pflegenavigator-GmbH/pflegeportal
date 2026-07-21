// src/app/[locale]/pflegegrad/modul4/page.tsx
'use client';

import { Sparkles } from 'lucide-react';

import { useAssessmentModule } from '@/src/hooks/useAssessmentModule';
import { BewertungOption, Frage } from '@/src/types/pflegegrad';

import { AssessmentModuleShell } from '../_components/AssessmentModuleShell';
import { AssessmentQuestionForm } from '../_components/AssessmentQuestionForm';

const SELBSTVERSORGUNG_FRAGEN: Frage[] = [
  {
    id: 'm4_1',
    text: 'Waschen des Oberkörpers und Intimbereichs',
    hilfe: 'Können Sie sich am Waschbecken oder in der Dusche selbstständig reinigen?',
  },
  {
    id: 'm4_2',
    text: 'Zähneputzen, Kämmen, Rasieren',
    hilfe: 'Können Sie die tägliche Mund- und Haarpflege eigenständig durchführen?',
  },
  {
    id: 'm4_3',
    text: 'Mundgerechtes Zubereiten & Aufnehmen von Speisen',
    hilfe: 'Können Sie Brot schneiden, Nahrung zum Mund führen, kauen und schlucken?',
  },
  {
    id: 'm4_4',
    text: 'Nutzen einer Toilette oder eines Toilettenstuhls',
    hilfe: 'Können Sie sich hinsetzen, aufstehen, die Kleidung richten und sich säubern?',
  },
  {
    id: 'm4_5',
    text: 'An- und Auskleiden des Oberkörpers',
    hilfe: 'Können Sie Hemden, Pullover oder Unterwäsche selbstständig an- und ablegen?',
  },
  {
    id: 'm4_6',
    text: 'An- und Auskleiden des Unterkörpers',
    hilfe: 'Können Sie Hosen, Socken und Schuhe ohne fremde Hilfe anziehen?',
  },
];

const BEWERTUNG_OPTIONEN: BewertungOption[] = [
  { value: '0', label: 'Selbstständig (Keine Einschränkung)', punkte: 0 },
  { value: '1', label: 'Überwiegend selbstständig (Leichte Einschränkung)', punkte: 1 },
  { value: '2', label: 'Überwiegend unselbstständig (Mittlere Einschränkung)', punkte: 2 },
  { value: '3', label: 'Unselbstständig (Vollständig hilfsbedürftig)', punkte: 3 },
];

export default function Modul4Page() {
  const m = useAssessmentModule({
    moduleName: 'modul4',
    questionKeys: SELBSTVERSORGUNG_FRAGEN.map((f) => f.id),
    next: (l) => `/${l}/pflegegrad/modul5`,
  });

  if (!m.hasMounted) return null;

  return (
    <AssessmentModuleShell
      title="Modul 4: Selbstversorgung"
      weightLabel="Gewichtung: 40% – Die wichtigste Kategorie im NBA-Verfahren!"
      weightAccent
      icon={Sparkles}
      accentColor="#10b981"
      caseCode={m.caseCode}
      fortschritt={m.fortschritt}
      backHref={`/${m.locale}/pflegegrad/modul3`}
      backLabel="Zurück zu Modul 3"
      nextLabel="Weiter zu Modul 5"
      loading={m.loading}
      canProceed={m.alleBeantwortet}
      onNext={m.speichernUndWeiter}
      legalStrong="Wichtiger gesetzlicher Hinweis:"
      legalText="Die Selbstversorgung bildet das Fundament der Pflegeeinstufung. Fehlerhafte Angaben in diesem Modul führen in der Praxis zu über 80 % aller fehlerhaften Bescheide durch die Pflegekassen."
    >
      <AssessmentQuestionForm
        fragen={SELBSTVERSORGUNG_FRAGEN}
        optionen={BEWERTUNG_OPTIONEN}
        antworten={m.antworten}
        onAntwort={m.setAntwort}
        icon={Sparkles}
      />
    </AssessmentModuleShell>
  );
}
