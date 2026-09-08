// src/app/[locale]/pflegegrad/_components/AssessmentQuestionForm.tsx
'use client';

import { HelpCircle, LucideIcon } from 'lucide-react';

import { Label, RadioGroup, RadioGroupItem } from '@/src/components/ui';
import styles from '@/src/styles/pflegegrad.module.css';
import { BewertungOption, Frage } from '@/src/types/pflegegrad';

interface AssessmentQuestionFormProps {
  fragen: Frage[];
  optionen: BewertungOption[];
  antworten: Record<string, string>;
  onAntwort: (frageId: string, wert: string) => void;
  /** Modul-Icon (Wayfinding) — Farbe kommt über --module-accent */
  icon: LucideIcon;
}

/**
 * Ein gemeinsames Frage-/Antwort-Formular für die Standard-Module (1–5).
 * Ersetzt die vier fast identischen Formulare (Kognition/Verhalten/
 * Selbstversorgung/Krankheitsbewältigung). Die Modulfarbe wird nicht
 * hardcodiert, sondern per --module-accent vererbt.
 */
export function AssessmentQuestionForm({
  fragen,
  optionen,
  antworten,
  onAntwort,
  icon: Icon,
}: AssessmentQuestionFormProps) {
  return (
    <div className={styles.questionList}>
      {fragen.map((frage) => (
        <div key={frage.id} className={styles.questionCard}>
          <div>
            <h3 className={styles.questionTitle}>
              <Icon className={`w-5 h-5 ${styles.questionIcon}`} />
              {frage.text}
            </h3>
            {frage.hilfe && (
              <p className={styles.help}>
                <HelpCircle className="w-4 h-4 flex-shrink-0" />
                {frage.hilfe}
              </p>
            )}
          </div>

          <RadioGroup
            value={antworten[frage.id] || ''}
            onValueChange={(wert) => onAntwort(frage.id, wert)}
            className={styles.options}
          >
            {optionen.map((opt) => {
              const optionId = `${frage.id}-${opt.value}`;
              const selected = antworten[frage.id] === opt.value;
              return (
                <div
                  key={opt.value}
                  onClick={() => onAntwort(frage.id, opt.value)}
                  className={`${styles.optionRow} ${selected ? styles.optionRowSelected : ''}`}
                >
                  <RadioGroupItem value={opt.value} id={optionId} className="h-5 w-5" />
                  <Label htmlFor={optionId} className={styles.optionLabel}>
                    {opt.label}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>
      ))}
    </div>
  );
}
