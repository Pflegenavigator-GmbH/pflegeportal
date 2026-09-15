// src/lib/widerspruch/utils.ts
import { addMonths, differenceInDays, format } from 'date-fns';

import { logger } from '@/src/lib/logger';
import {
  ampelStatusFuerTage,
  naechsterWerktag,
  zuLokalemTagesbeginn,
  type AmpelStatus,
} from '@/src/lib/widerspruch/fristen';

// Fristen-Domäne liegt in ./fristen.ts; hier re-exportiert, damit der
// Widerspruch-Bereich eine Import-Adresse behält.
export * from '@/src/lib/widerspruch/fristen';

export type WiderspruchTyp = 'pflegegrad' | 'mdk-gutachten' | 'klage';

export interface WiderspruchFrist {
  typ: WiderspruchTyp;
  bezeichnung: string;
  gesetz: string;
  fristMonate: number;
  bescheidDatum: Date;
  fristEnde: Date;
  fristEndeWerktag: Date;
  istAbgelaufen: boolean;
  verbleibendeTage: number;
  ampelStatus: AmpelStatus;
}

export interface WiderspruchDaten {
  id?: string;
  caseCode?: string | null;
  typ: WiderspruchTyp;
  bescheidDatum: string;
  versicherterName: string;
  pflegekasse: string;
  versicherungsnummer?: string;
  strasse: string;
  plz: string;
  ort: string;
  begruendung?: string;
  erstelltAm?: string;
}

/**
 * Schreiben-spezifische Konfiguration: bestimmt Betreff und zitierte
 * Rechtsgrundlage des erzeugten Anschreibens. Die Fristberechnung selbst
 * kommt aus ./fristen.ts, damit Schwellen und Werktagsregel nur einmal
 * existieren.
 */
const WIDERSPRUCH_KONFIG: Record<
  WiderspruchTyp,
  { bezeichnung: string; gesetz: string; fristMonate: number }
> = {
  pflegegrad: {
    bezeichnung: 'Widerspruch gegen Pflegegrad-Bescheid',
    gesetz: '§ 84 Abs. 1 SGG',
    fristMonate: 1,
  },
  'mdk-gutachten': {
    // Akteneinsicht ist an die laufende Widerspruchsfrist gekoppelt.
    bezeichnung: 'Anforderung des MD-Gutachtens',
    gesetz: '§ 25 SGB X',
    fristMonate: 1,
  },
  klage: {
    bezeichnung: 'Klageerhebung beim Sozialgericht',
    gesetz: '§ 87 Abs. 1 SGG',
    fristMonate: 1,
  },
};

// --- FRISTEN LOGIK ---

/**
 * Frist für das konkrete Anschreiben. Für die Gesamtübersicht aller
 * Verfahrensfristen siehe `berechneFristen` in ./fristen.ts.
 */
export function berechneFrist(
  bescheidDatum: Date | string,
  typ: WiderspruchTyp = 'pflegegrad',
  referenzDatum: Date = new Date()
): WiderspruchFrist {
  logger.debug({ bescheidDatum, typ }, 'Berechne Frist für Widerspruch');

  const konfig = WIDERSPRUCH_KONFIG[typ];
  const start = zuLokalemTagesbeginn(bescheidDatum);
  if (!start) {
    throw new Error(`Ungültiges Bescheiddatum für die Fristberechnung: ${String(bescheidDatum)}`);
  }

  const heute = zuLokalemTagesbeginn(referenzDatum) ?? new Date();
  const fristEnde = addMonths(start, konfig.fristMonate);
  const fristEndeWerktag = naechsterWerktag(fristEnde);
  const verbleibendeTage = differenceInDays(fristEndeWerktag, heute);

  const resultat: WiderspruchFrist = {
    typ,
    bezeichnung: konfig.bezeichnung,
    gesetz: konfig.gesetz,
    fristMonate: konfig.fristMonate,
    bescheidDatum: start,
    fristEnde,
    fristEndeWerktag,
    istAbgelaufen: verbleibendeTage < 0,
    verbleibendeTage,
    ampelStatus: ampelStatusFuerTage(verbleibendeTage),
  };

  logger.debug({ resultat }, 'Fristberechnung abgeschlossen');
  return resultat;
}

const AMPEL_SYMBOL: Record<AmpelStatus, string> = {
  gruen: '🟢',
  gelb: '🟡',
  rot: '🔴',
  wartend: '⏳',
  abgelaufen: '⚠️',
};

/** Einzeilige Textfassung — für PDF-/Briefausgaben ohne Markup. */
export function formatiereFristInfo(frist: WiderspruchFrist): string {
  if (frist.istAbgelaufen)
    return `⚠️ FRIST ABGELAUFEN seit ${format(frist.fristEndeWerktag, 'dd.MM.yyyy')}`;
  return `${AMPEL_SYMBOL[frist.ampelStatus]} Noch ${frist.verbleibendeTage} Tage bis zum wirksamen Fristende am ${format(frist.fristEndeWerktag, 'dd.MM.yyyy')}`;
}

// --- TEXT GENERIERUNG ---

export function generiereWiderspruchBrief(
  daten: WiderspruchDaten,
  frist: WiderspruchFrist
): string {
  logger.info({ typ: daten.typ }, 'Generiere Widerspruchsbrief');

  const heute = format(new Date(), 'dd.MM.yyyy');
  const bescheidDatum = format(new Date(daten.bescheidDatum), 'dd.MM.yyyy');

  let betreffzeile = `Widerspruch gegen den Bescheid zur Pflegeeinstufung vom ${bescheidDatum}`;
  let kernAnschreiben = `hiermit lege ich fristgerecht Widerspruch gegen Ihren Bescheid vom ${bescheidDatum} ein.`;
  let kernBegruendung =
    daten.begruendung ||
    'Zur Fristwahrung lege ich diesen Widerspruch zunächst unbegründet ein. Ich fordere Sie hiermit auf, mir das vollständige medizinische Gutachten des Medizinischen Dienstes (MD) unverzüglich in Kopie zuzusenden. Nach Erhalt und Prüfung werde ich die detaillierte Begründung nachreichen.';

  if (daten.typ === 'mdk-gutachten') {
    betreffzeile = `Anforderung des MD-Gutachtens zum Bescheid vom ${bescheidDatum}`;
    kernAnschreiben = `hiermit fordere ich Sie auf, mir das der Entscheidung vom ${bescheidDatum} zugrundeliegende, vollständige medizinische Gutachten des Medizinischen Dienstes (MD) gemäß § 25 SGB X zur Einsichtnahme zu übersenden.`;
    kernBegruendung =
      'Das Gutachten wird zwingend für die materielle Überprüfung der Einstufungskriterien und zur Vorbereitung einer detaillierten Begründung benötigt.';
  } else if (daten.typ === 'klage') {
    betreffzeile = `KLAGEGEGENSTAND: Widerspruchsbescheid vom ${bescheidDatum}`;
    kernAnschreiben = `hiermit erhebe ich fristgerecht Klage beim zuständigen Sozialgericht gegen den Widerspruchsbescheid vom ${bescheidDatum}.`;
    kernBegruendung =
      daten.begruendung ||
      `Der Widerspruchsbescheid vom ${bescheidDatum} verkennt die tatsächliche Pflegebedürftigkeit und die Einschränkungen der Selbstständigkeit im Alltag. Eine umfassende Klagebegründung erfolgt nach Akteneinsicht durch das Gericht.`;
  }

  return `${daten.versicherterName}\n${daten.strasse}\n${daten.plz} ${daten.ort}\n\nAn die\n${daten.pflegekasse}\nWiderspruchsstelle\n[Bitte Anschrift der Kasse ergänzen]\n\n\n${daten.ort}, den ${heute}\n\nBetreff: ${betreffzeile}\nVersicherungsnummer: ${daten.versicherungsnummer || '[BITTE EINTRAGEN]'}\nAktenzeichen Portal: ${daten.caseCode?.toUpperCase() || 'OFFLINE_CORE'}\n\nSehr geehrte Damen und Herren,\n\n${kernAnschreiben}\n\nBEGRÜNDUNG / ANTRAGSMATERIE:\n${kernBegruendung}\n\nDie gesetzliche Frist für dieses Verfahren läuft gemäß ${frist.gesetz} am ${format(frist.fristEndeWerktag, 'dd.MM.yyyy')} ab. Ich bitte um eine schriftliche Bestätigung des Eingangs.\n\nMit freundlichen Grüßen,\n\n\n___________________________\n${daten.versicherterName}`;
}