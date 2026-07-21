// src/app/[locale]/pflegegrad/modul2/page.tsx
'use client';

import { Brain } from 'lucide-react';

import { useAssessmentModule } from '@/src/hooks/useAssessmentModule';
import { BewertungOption, Frage } from '@/src/types/pflegegrad';

import { AssessmentModuleShell } from '../_components/AssessmentModuleShell';
import { AssessmentQuestionForm } from '../_components/AssessmentQuestionForm';

// Offizielle NBA-Kriterien für Modul 2 nach § 15 SGB XI
const KOGNITION_FRAGEN: Frage[] = [
  {
    id: 'm2_1',
    text: 'Personen aus dem näheren Umfeld erkennen',
    hilfe: 'Werden Familienmitglieder oder Nachbarn zweifelsfrei identifiziert?',
  },
  {
    id: 'm2_2',
    text: 'Örtliche Orientierung',
    hilfe: 'Findet sich die Person in der eigenen Wohnung oder der gewohnten Umgebung zurecht?',
  },
  {
    id: 'm2_3',
    text: 'Zeitliche Orientierung',
    hilfe: 'Können Tageszeit, Wochentag und Jahreszeit korrekt benannt werden?',
  },
  {
    id: 'm2_4',
    text: 'Erinnern an wesentliche Ereignisse',
    hilfe: 'Werden wichtige Erlebnisse oder Vereinbarungen (z.B. Arztbesuche) behalten?',
  },
  {
    id: 'm2_5',
    text: 'Steuerung von Alltagshandlungen',
    hilfe: 'Können mehrschrittige Alltagsaktivitäten selbstständig geplant und umgesetzt werden?',
  },
];

const BEWERTUNG_OPTIONEN: BewertungOption[] = [
  { value: '0', label: 'Keine Einschränkung (Selbstständig)', punkte: 0 },
  { value: '1', label: 'Leichte Einschränkung (Größtenteils selbstständig)', punkte: 1 },
  { value: '2', label: 'Mittlere Einschränkung (Größtenteils unselbstständig)', punkte: 2 },
  { value: '3', label: 'Schwere Einschränkung (Unselbstständig)', punkte: 3 },
];

export default function Modul2Page() {
  const m = useAssessmentModule({
    moduleName: 'modul2',
    questionKeys: KOGNITION_FRAGEN.map((f) => f.id),
    next: (l) => `/${l}/pflegegrad/modul3`,
  });

  if (!m.hasMounted) return null;

  return (
    <AssessmentModuleShell
      title="Modul 2: Kognition & Kommunikation"
      weightLabel="Gewichtung: 15% (oder Modul 3, je nachdem was höher ist)"
      icon={Brain}
      accentColor="#a855f7"
      caseCode={m.caseCode}
      fortschritt={m.fortschritt}
      backHref={`/${m.locale}/pflegegrad/modul1`}
      backLabel="Zurück zu Modul 1"
      nextLabel="Weiter zu Modul 3"
      loading={m.loading}
      canProceed={m.alleBeantwortet}
      onNext={m.speichernUndWeiter}
      legalStrong="Wichtiger rechtlicher Hinweis:"
      legalText="Die im Modul 2 erfassten Kriterien basieren auf den offiziellen Richtlinien des Medizinischen Dienstes (MD) zur Feststellung von Pflegebedürftigkeit nach dem SGB XI."
    >
      <AssessmentQuestionForm
        fragen={KOGNITION_FRAGEN}
        optionen={BEWERTUNG_OPTIONEN}
        antworten={m.antworten}
        onAntwort={m.setAntwort}
        icon={Brain}
      />
    </AssessmentModuleShell>
  );
}
