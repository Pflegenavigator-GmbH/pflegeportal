// src/components/fristen/BescheidDatumAbfrage.tsx
'use client';

import { CalendarClock, CheckCircle2 } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import type { DatumFehlerCode } from '@/src/lib/widerspruch/bescheid-datum';
import {
  heuteAlsIso,
  isoVorTagen,
  pruefeBescheidDatum,
} from '@/src/lib/widerspruch/bescheid-datum';
import styles from '@/src/styles/fristen.module.css';

interface Props {
  /** Bereits gespeichertes Datum (ISO) oder null. */
  wert: string | null;
  /** Wird mit einem validierten ISO-Datum aufgerufen. */
  onChange: (isoDatum: string) => void;
  gespeichertWird?: boolean;
}

/**
 * Fragt den Zugang des Bescheids ab — als Schnellauswahl statt als Vorbelegung.
 *
 * Ein Default auf das heutige Datum wäre bequemer, aber gefährlich: Ein
 * Bescheid liegt immer in der Vergangenheit, ein Default könnte die
 * Restfrist deshalb ausschließlich überschätzen und würde eine knappe Frist
 * fälschlich als entspannt anzeigen. Ein Tippen auf „Heute" kostet genauso
 * wenig, ist aber eine Aussage des Nutzers statt einer Vermutung des Systems.
 */
export function BescheidDatumAbfrage({ wert, onChange, gespeichertWird = false }: Props) {
  const t = useTranslations('widerspruch.datumsAbfrage');
  const format = useFormatter();
  const feldId = useId();
  const fehlerId = useId();
  const [eigenesDatum, setEigenesDatum] = useState('');
  // Der Fehlercode statt des fertigen Satzes: Sonst bliebe die Meldung in der
  // Sprache hängen, in der sie erzeugt wurde.
  const [fehler, setFehler] = useState<DatumFehlerCode | null>(null);
  const [bearbeiten, setBearbeiten] = useState(false);

  const uebernehmen = (isoDatum: string) => {
    const pruefung = pruefeBescheidDatum(isoDatum);
    if (!pruefung.gueltig) {
      setFehler(pruefung.code);
      return;
    }
    setFehler(null);
    setBearbeiten(false);
    onChange(pruefung.wert);
  };

  // Bereits erfasst: Bestätigung zeigen, Korrektur bleibt jederzeit möglich.
  if (wert && !bearbeiten) {
    return (
      <div className={styles.abfrage}>
        <p className={styles.bestaetigt}>
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>
            {t('bestaetigt')} <strong>{format.dateTime(new Date(wert), 'kurz')}</strong>
          </span>
        </p>
        <button
          type="button"
          className={styles.aendernKnopf}
          onClick={() => {
            setEigenesDatum(wert);
            setBearbeiten(true);
          }}
        >
          {t('korrigieren')}
        </button>
      </div>
    );
  }

  return (
    <fieldset className={styles.abfrage} disabled={gespeichertWird}>
      <legend className={styles.abfrageFrage}>
        <CalendarClock size={18} aria-hidden="true" /> {t('frage')}
      </legend>

      <div className={styles.schnellwahl}>
        <button
          type="button"
          className={styles.schnellwahlKnopf}
          onClick={() => uebernehmen(heuteAlsIso())}
        >
          {t('heute')}
        </button>
        <button
          type="button"
          className={styles.schnellwahlKnopf}
          onClick={() => uebernehmen(isoVorTagen(1))}
        >
          {t('gestern')}
        </button>
        <button
          type="button"
          className={styles.schnellwahlKnopf}
          onClick={() => uebernehmen(isoVorTagen(7))}
        >
          {t('vorEinerWoche')}
        </button>
      </div>

      <div className={styles.datumsZeile}>
        <input
          id={feldId}
          type="date"
          max={heuteAlsIso()}
          value={eigenesDatum}
          aria-label={t('feldLabel')}
          aria-invalid={fehler !== null}
          aria-describedby={fehler ? fehlerId : undefined}
          onChange={(e) => {
            setEigenesDatum(e.target.value);
            setFehler(null);
          }}
          className={`${styles.datumsFeld} ${fehler ? styles.datumsFeldFehler : ''}`}
        />
        <button
          type="button"
          className={styles.schnellwahlKnopf}
          onClick={() => uebernehmen(eigenesDatum)}
        >
          {gespeichertWird ? t('speichert') : t('uebernehmen')}
        </button>
      </div>

      {fehler && (
        <p id={fehlerId} className={styles.fehlerText} role="alert">
          {t(`fehler.${fehler}`)}
        </p>
      )}

      <p className={styles.abfrageHinweis}>{t('hinweis')}</p>
    </fieldset>
  );
}
