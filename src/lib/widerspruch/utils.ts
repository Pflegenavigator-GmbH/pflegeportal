import { addMonths, addDays, format, differenceInDays } from 'date-fns';

export type WiderspruchTyp = 'pflegegrad' | 'mdk-gutachten' | 'klage';
export type AmpelStatus = 'gruen' | 'gelb' | 'rot' | 'abgelaufen';

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

const FEIERTAGE_DE: Record<string, string[]> = {
  '2025': ['01-01', '04-18', '04-21', '05-01', '05-29', '06-09', '10-03', '12-25', '12-26'],
  '2026': ['01-01', '04-03', '04-06', '05-01', '05-14', '05-25', '10-03', '12-25', '12-26'],
  '2027': ['01-01', '03-26', '03-29', '05-01', '05-06', '05-17', '10-03', '12-25', '12-26'],
};

const WIDERSPRUCH_KONFIG: Record<
  WiderspruchTyp,
  { bezeichnung: string; gesetz: string; fristMonate: number }
> = {
  pflegegrad: {
    bezeichnung: 'Widerspruch gegen Pflegegrad-Bescheid',
    gesetz: '§ 78 SGB X',
    fristMonate: 1,
  },
  'mdk-gutachten': {
    bezeichnung: 'Anforderung des MDK-Gutachtens',
    gesetz: '§ 78 SGB X',
    fristMonate: 1,
  },
  klage: { bezeichnung: 'Klageerhebung beim Sozialgericht', gesetz: '§ 84 SGG', fristMonate: 1 },
};

export function berechneFrist(
  bescheidDatum: Date,
  typ: WiderspruchTyp = 'pflegegrad'
): WiderspruchFrist {
  const konfig = WIDERSPRUCH_KONFIG[typ];
  const fristEnde = addMonths(bescheidDatum, konfig.fristMonate);
  const fristEndeWerktag = naechsterWerktag(fristEnde);

  const heute = new Date();
  heute.setHours(0, 0, 0, 0);

  const verbleibendeTage = differenceInDays(fristEndeWerktag, heute);
  const istAbgelaufen = verbleibendeTage < 0;

  let ampelStatus: AmpelStatus = 'gruen';
  if (istAbgelaufen) ampelStatus = 'abgelaufen';
  else if (verbleibendeTage > 14) ampelStatus = 'gruen';
  else if (verbleibendeTage >= 7) ampelStatus = 'gelb';
  else ampelStatus = 'rot';

  return {
    typ,
    bezeichnung: konfig.bezeichnung,
    gesetz: konfig.gesetz,
    fristMonate: konfig.fristMonate,
    bescheidDatum: new Date(bescheidDatum),
    fristEnde,
    fristEndeWerktag,
    istAbgelaufen,
    verbleibendeTage: Math.max(0, verbleibendeTage),
    ampelStatus,
  };
}

function istFeiertag(datum: Date): boolean {
  const jahr = datum.getFullYear().toString();
  const tagMonat = format(datum, 'MM-dd');
  return (FEIERTAGE_DE[jahr] || []).includes(tagMonat);
}

function istWochenende(datum: Date): boolean {
  const tag = datum.getDay();
  return tag === 0 || tag === 6;
}

function naechsterWerktag(datum: Date): Date {
  let aktuellesDatum = new Date(datum);
  while (istWochenende(aktuellesDatum) || istFeiertag(aktuellesDatum)) {
    aktuellesDatum = addDays(aktuellesDatum, 1);
  }
  return aktuellesDatum;
}

export function formatiereFristInfo(frist: WiderspruchFrist): string {
  if (frist.istAbgelaufen)
    return `⚠️ FRIST ABGELAUFEN seit ${format(frist.fristEndeWerktag, 'dd.MM.yyyy')}`;
  const emoji = frist.ampelStatus === 'gruen' ? '🟢' : frist.ampelStatus === 'gelb' ? '🟡' : '🔴';
  return `${emoji} Noch ${frist.verbleibendeTage} Tage bis zum wirksamen Fristende am ${format(frist.fristEndeWerktag, 'dd.MM.yyyy')}`;
}

// ✅ JETZT DYNAMISCH NACH VERFAHRENSTYP (Pflegegrad, Gutachten oder Klage)
export function generiereWiderspruchBrief(
  daten: WiderspruchDaten,
  frist: WiderspruchFrist
): string {
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
      'Der Widerspruchsbescheid vom %bescheidDatum% verkennt die tatsächliche Pflegebedürftigkeit und die Einschränkungen der Selbstständigkeit im Alltag. Eine umfassende Klagebegründung erfolgt nach Akteneinsicht durch das Gericht.';
  }

  return `
${daten.versicherterName}
${daten.strasse}
${daten.plz} ${daten.ort}

An die
${daten.pflegekasse}
Widerspruchsstelle
[Bitte Anschrift der Kasse ergänzen]


${daten.ort}, den ${heute}

Betreff: ${betreffzeile}
Versicherungsnummer: ${daten.versicherungsnummer || '[BITTE EINTRAGEN]'}
Aktenzeichen Portal: ${daten.caseCode?.toUpperCase() || 'OFFLINE_CORE'}

Sehr geehrte Damen und Herren,

${kernAnschreiben}

BEGRÜNDUNG / ANTRAGSMATERIE:
${kernBegruendung}

Die gesetzliche Frist für dieses Verfahren läuft gemäß ${frist.gesetz} am ${format(frist.fristEndeWerktag, 'dd.MM.yyyy')} ab. Ich bitte um eine schriftliche Bestätigung des Eingangs.

Mit freundlichen Grüßen,


___________________________
${daten.versicherterName}
  `.trim();
}
