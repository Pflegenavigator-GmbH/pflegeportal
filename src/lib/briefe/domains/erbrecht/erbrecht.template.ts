// src/lib/briefe/domains/erbrecht/erbrecht.template.ts
import { BriefPayload } from '@/src/types/briefe';

export const generateErbrechtTemplate = (data: BriefPayload, heute: string): string[] => {
  const parts: string[] = [
    `${data.absender.name}`,
    `${data.absender.strasse}`,
    `${data.absender.plz} ${data.absender.ort}`,
    data.absender.telefon ? `Tel.: ${data.absender.telefon}` : '',
    data.absender.geburtsdatum ? `Geb.: ${data.absender.geburtsdatum}` : '',
    '\n\n',
    `${data.empfaenger.name}`,
    data.empfaenger.strasse ?? '',
    `${data.empfaenger.plz} ${data.empfaenger.ort}`,
    '\n\n',
    `${data.absender.ort}, den ${heute}`,
    '\n\n',
  ];

  switch (data.verfahrensart) {
    case 'testament':
      parts.push(
        `Betreff: Notarielle Beurkundung eines Testaments`,
        '\n\n',
        `${data.inhalt.anrede}`,
        '\n',
        `hiermit bitte ich um notarielle Beurkundung meines Testaments.`,
        '\n',
        `1. PERSÖNLICHE VERHÄLTNISSE`,
        `Name: ${data.absender.name}`,
        `\n`,
        `2. VERERBUNGSWÜNSCHE UND BEGRÜNDUNG`,
        `${data.inhalt.hauptteil}`,
        '\n',
        `3. HINWEIS ZUR NOTWENDIGEN BEURKUNDUNG`,
        `Nach § 2247 BGB muss ein Testament eigenhändig geschrieben und unterschrieben werden (nicht bei Beurkundung beim Notar).`,
        `Bei notarieller Beurkundung (§ 2232 BGB) ist keine eigenhändige Schrift erforderlich.`
      );
      break;

    case 'pflichtteil':
      parts.push(
        `Betreff: Pflichtteilsgeltendmachung / Anspruch auf Pflichtteil`,
        '\n\n',
        `${data.inhalt.anrede}`,
        '\n',
        `hiermit mache ich meinen Pflichtteilsgeltendmachungsanspruch geltend.`,
        '\n',
        `Als Abkömmling des/der Verstorbenen bin ich pflichtteilsberechtigt nach § 2303 BGB. Mein Pflichtteil beträgt 50% des gesetzlichen Erbteils.`,
        '\n',
        `Sachverhalt & Begründung:`,
        `${data.inhalt.hauptteil}`,
        '\n',
        `Ich bitte um Mitteilung des Nachlassinventars und Auszahlung meines Pflichtteils.`
      );
      break;

    case 'erbschaftsteuer':
      parts.push(
        `Betreff: Erbschaftsteuererklärung`,
        '\n\n',
        `${data.inhalt.anrede}`,
        '\n',
        `hiermit reiche ich Angaben zu meiner Erbschaftsteuererklärung ein.`,
        '\n',
        `Relevanter Sachverhalt:`,
        `${data.inhalt.hauptteil}`,
        '\n',
        `Bitte bestätigen Sie den Erhalt und teilen Sie mir die zu entrichtende Erbschaftsteuer mit.`
      );
      break;

    case 'vorweggenommene_erbschaft':
    default:
      parts.push(
        `Betreff: Schenkung / Vorweggenommene Erbfolge`,
        '\n\n',
        `${data.inhalt.anrede}`,
        '\n',
        `hiermit bitte ich um Vorbereitung einer notariellen Beurkundung bezüglich einer vorweggenommenen Erbfolge.`,
        '\n',
        `Details zum Gegenstand der Schenkung / Übertragung:`,
        `${data.inhalt.hauptteil}`,
        '\n',
        `Bei Schenkungen unter Lebenden ist eine spätere Pflichtteilsergänzung gemäß § 2325 BGB möglich. Der Wert wird bei späterer Erbfolge berücksichtigt.`
      );
      break;
  }

  parts.push(
    '\n',
    'Mit freundlichen Grüßen',
    '\n\n',
    '_______________________',
    `${data.absender.name}`,
    '\n',
    'HINWEIS:',
    'Erbrechtliche Beratung ist besonders bei größeren Vermögen dringend empfohlen.',
    'Die gesetzliche Erbfolge lässt sich durch eine rechtzeitige letztwillige Verfügung (Testament/Erbvertrag) gezielt steuern.'
  );

  return parts;
};
