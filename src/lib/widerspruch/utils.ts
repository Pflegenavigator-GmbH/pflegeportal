// src/lib/widerspruch/utils.ts
import { addMonths, differenceInDays, format } from 'date-fns';

import { logger } from '@/src/lib/logger';
import {
  ampelStatusFuerTage,
  naechsterWerktag,
  zuLokalemTagesbeginn,
  type AmpelStatus,
} from '@/src/lib/widerspruch/fristen';
import { ModuleScores } from '@/src/types/pflegegrad';

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
  logger.info({ typ: daten.typ, caseCode: daten.caseCode }, 'Generiere Widerspruchsbrief');

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

export function generateWiderspruchBegruendung(
  currentLevel: number,
  expectedLevel: number,
  scores: ModuleScores,
  userReasons?: string
): string {
  const lines: string[] = [
    `Nach den NBA-Kriterien ergibt sich aus den vorliegenden Einschränkungen ein höherer Pflegebedarf als im Pflegegrad ${currentLevel} berücksichtigt.\n`,
  ];
  if (scores[4] > 40)
    lines.push(
      'Selbstversorgung (Gewichtung 40%): Deutliche Einschränkungen bei Körperpflege, An-/Auskleiden sowie Essen/Trinken erfordern tägliche Unterstützung.'
    );
  if (scores[2] > 15 || scores[3] > 15)
    lines.push(
      'Kognition/Verhalten (Gewichtung 15%): Einschränkungen in Orientierung, Entscheidungsfähigkeit oder psychische Belastungen liegen vor.'
    );
  if (scores[5] > 20)
    lines.push(
      'Krankheitsbewältigung (Gewichtung 20%): Komplexe medizinische Maßnahmen und Medikamentenmanagement sind notwendig.'
    );
  if (scores[1] > 10)
    lines.push(
      'Mobilität (Gewichtung 10%): Einschränkungen bei Aufstehen, Gehen oder Treppensteigen schränken die Teilhabe ein.'
    );
  lines.push(
    '\n',
    `Die Summe der Beeinträchtigungen entspricht dem Pflegegrad ${expectedLevel}. Die aktuelle Einstufung in Pflegegrad ${currentLevel} bildet den tatsächlichen Hilfebedarf nicht ab.`
  );
  if (userReasons) lines.push('\n', 'Zusätzliche Begründung:', userReasons);
  lines.push(
    '\n',
    'Rechtliche Grundlage:',
    'Gemäß § 124 SGB XI beantrage ich eine erneute Begutachtung durch den MDK.'
  );
  return lines.join('\n');
}

// --- CHANCEN & CHECKLISTEN ---

export function calculateWiderspruchChance(
  currentLevel: number,
  expectedLevel: number,
  scores: ModuleScores
): {
  chance: 'high' | 'medium' | 'low';
  reason: string;
} {
  const scoreDiff = expectedLevel - currentLevel;
  if (scoreDiff === 1 && scores[4] > 40)
    return {
      chance: 'high',
      reason: 'Nur 1 Level Unterschied, starke Selbstversorgungs-Einschränkungen (40% Gewichtung)',
    };
  if (scoreDiff <= 2 && (scores[2] > 10 || scores[3] > 10))
    return {
      chance: 'medium',
      reason: 'Mögliche Verbesserung durch vollständige Begutachtung aller Module',
    };
  return {
    chance: 'low',
    reason: 'Größerer Unterschied - erfolgreich wenn neue medizinische Entwicklungen vorliegen',
  };
}

export function getMDPreparationChecklist(): string[] {
  return [
    'Alle Medikamente bereitlegen',
    'Ärztliche Berichte parat haben',
    'Pflegeprotokoll/Tagebuch aktuell (letzte 4 Wochen)',
    'Zeitaufwand dokumentiert: Wie lange dauert was?',
    'Häufigkeiten notiert: Wie oft pro Tag?',
    'Schlechte Tage beschreiben (nicht die guten!)',
    'Fragen vorbereitet',
    'Unterlagen sortiert: Arztberichte, Rezepte, Labor',
    'Begleitung organisiert',
    'Notizblock für eigene Notizen',
  ];
}
