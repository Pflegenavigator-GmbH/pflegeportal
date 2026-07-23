// src/components/fristen/BescheidDatumAbfrage.tsx
'use client';

import { format } from 'date-fns';
import { CalendarClock, CheckCircle2 } from 'lucide-react';
import { useId, useState } from 'react';

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
  const feldId = useId();
  const fehlerId = useId();
  const [eigenesDatum, setEigenesDatum] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);
  const [bearbeiten, setBearbeiten] = useState(false);

  const uebernehmen = (isoDatum: string) => {
    const pruefung = pruefeBescheidDatum(isoDatum);
    if (!pruefung.gueltig) {
      setFehler(pruefung.fehler);
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
            Bescheid zugegangen am <strong>{format(new Date(wert), 'dd.MM.yyyy')}</strong>
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
          Datum korrigieren
        </button>
      </div>
    );
  }

  return (
    <fieldset className={styles.abfrage} disabled={gespeichertWird}>
      <legend className={styles.abfrageFrage}>
        <CalendarClock size={18} aria-hidden="true" /> Wann haben Sie den Bescheid erhalten?
      </legend>

      <div className={styles.schnellwahl}>
        <button
          type="button"
          className={styles.schnellwahlKnopf}
          onClick={() => uebernehmen(heuteAlsIso())}
        >
          Heute
        </button>
        <button
          type="button"
          className={styles.schnellwahlKnopf}
          onClick={() => uebernehmen(isoVorTagen(1))}
        >
          Gestern
        </button>
        <button
          type="button"
          className={styles.schnellwahlKnopf}
          onClick={() => uebernehmen(isoVorTagen(7))}
        >
          Vor einer Woche
        </button>
      </div>

      <div className={styles.datumsZeile}>
        <input
          id={feldId}
          type="date"
          max={heuteAlsIso()}
          value={eigenesDatum}
          aria-label="Datum des Bescheid-Zugangs"
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
          {gespeichertWird ? 'Speichert…' : 'Übernehmen'}
        </button>
      </div>

      {fehler && (
        <p id={fehlerId} className={styles.fehlerText} role="alert">
          {fehler}
        </p>
      )}

      <p className={styles.abfrageHinweis}>
        Ohne dieses Datum lässt sich Ihre Widerspruchsfrist nicht berechnen. Maßgeblich ist der Tag,
        an dem der Bescheid bei Ihnen ankam — nicht das Datum auf dem Schreiben.
      </p>
    </fieldset>
  );
}
