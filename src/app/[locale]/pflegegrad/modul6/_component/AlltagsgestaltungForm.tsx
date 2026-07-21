// src/app/[locale]/pflegegrad/modul6/_component/AlltagsgestaltungForm.tsx
'use client';

import { Label, RadioGroup, RadioGroupItem } from '@/src/components/ui';
import styles from '@/src/styles/pflegegrad.module.css';

export interface AlltagsFrage {
  id: string;
  key: 'haushalt' | 'einkaufen' | 'kochen' | 'finanzen' | 'entscheidungen';
  text: string;
  optionen: {
    value: string;
    title: string;
    sub: string;
  }[];
}

interface AlltagsgestaltungFormProps {
  fragen: AlltagsFrage[];
  antworten: Record<string, string>;
  onAntwort: (key: string, value: string) => void;
}

/**
 * Modul-6-Formular: wie das Standard-Formular, aber mit zweizeiligen Optionen
 * (Titel + erläuternder Untertext). Nutzt dieselben Token-basierten Klassen.
 */
export function AlltagsgestaltungForm({
  fragen,
  antworten,
  onAntwort,
}: AlltagsgestaltungFormProps) {
  return (
    <div className={styles.questionList}>
      {fragen.map((fr) => (
        <div key={fr.id} className={styles.questionCard}>
          <h3 className={styles.questionTitle}>{fr.text}</h3>
          <RadioGroup
            value={antworten[fr.key] || ''}
            onValueChange={(v) => onAntwort(fr.key, v)}
            className={styles.optionsFlush}
          >
            {fr.optionen.map((opt) => {
              const optionId = `${fr.id}-${opt.value}`;
              const selected = antworten[fr.key] === opt.value;
              return (
                <div
                  key={opt.value}
                  className={`${styles.optionRow} ${selected ? styles.optionRowSelected : ''}`}
                  style={{ alignItems: 'flex-start' }}
                  onClick={() => onAntwort(fr.key, opt.value)}
                >
                  <RadioGroupItem value={opt.value} id={optionId} className="h-5 w-5 mt-0.5" />
                  <Label htmlFor={optionId} className={styles.optionLabel}>
                    <span style={{ display: 'block', fontWeight: 600 }}>{opt.title}</span>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 400,
                        color: 'var(--color-text-muted)',
                        marginTop: '0.125rem',
                      }}
                    >
                      {opt.sub}
                    </span>
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
