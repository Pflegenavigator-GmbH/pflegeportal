// src/lib/briefe/schwerbehindertenausweis.ts
// Schwerbehindertenausweis (GdB) - Antrag beim Versorgungsamt
// PflegeNavigator EU - Bei Pflegegrad 3+ automatisch GdB 50+ möglich
import { BriefPayload } from '@/src/types/briefe';

export const SCHWERBEHINDERTEN_LEITLINIEN = {
  sgb_ix_2: "Schwerbehindert im Sinne des Gesetzes sind Personen mit einem Grad der Behinderung (GdB) von mindestens 50.",
  sgb_ix_152: "Die Feststellung des Vorliegens einer Behinderung und des Grades der Behinderung (GdB) erfolgt auf Antrag durch die zuständigen Versorgungsämter."
};

export class SchwerbehindertenausweisGenerator {
  generateBrief(data: BriefPayload): string {
    const heute = new Date().toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    let brief = `${data.absender.name}\n`;
    brief += `${data.absender.strasse}\n`;
    brief += `${data.absender.plz} ${data.absender.ort}\n`;
    if (data.absender.telefon) brief += `Tel.: ${data.absender.telefon}\n`;
    if (data.absender.sozialversicherungsnummer) brief += `Sozialversicherungs-Nr.: ${data.absender.sozialversicherungsnummer}\n`;

    brief += `\n\n\n`;
    brief += `${data.empfaenger.name}\n`;
    if (data.empfaenger.strasse) brief += `${data.empfaenger.strasse}\n`;
    brief += `${data.empfaenger.plz} ${data.empfaenger.ort}\n\n\n`;

    brief += `${data.absender.ort}, den ${heute}\n\n\n`;
    brief += `Betreff: ${data.betreff || 'Erstantrag auf Feststellung eines Grades der Behinderung (GdB) nach § 152 SGB IX'}\n\n\n`;

    brief += `${data.inhalt.anrede}\n\n`;
    brief += `hiermit beantrage ich die offizielle Feststellung des Grades der Behinderung (GdB) sowie die Zuerkennung eventueller Merkzeichen gemäß den Bestimmungen des SGB IX.\n\n`;

    brief += `Darstellung der dauerhaften Funktionsbeeinträchtigungen:\n`;
    brief += `${data.inhalt.hauptteil}\n\n`;

    if (data.verfahrensart) {
      brief += `Angestrebtes Verfahren / Zusatz-Option: ${data.verfahrensart}\n\n`;
    }

    brief += `Gesetzliche Grundlagen:\n`;
    brief += `• § 2 SGB IX: ${SCHWERBEHINDERTEN_LEITLINIEN.sgb_ix_2}\n`;
    brief += `• § 152 SGB IX: ${SCHWERBEHINDERTEN_LEITLINIEN.sgb_ix_152}\n\n`;

    brief += `Ich bitte das Versorgungsamt, die notwendigen Befundberichte bei den behandelnden Fachärzten einzuholen.\n\n`;

    brief += `Mit freundlichen Grüßen\n\n\n`;
    brief += `_______________________\n`;
    brief += `${data.absender.name}\n\n`;

    brief += `Anlagen:\n`;
    brief += `- Kopie Personalausweis\n`;
    brief += `- Liste der behandelnden Fachärzte und Kliniken\n`;
    if (data.anlagen) {
      data.anlagen.forEach(anlage => {
        brief += `- ${anlage}\n`;
      });
    }

    return brief;
  }
}

export const schwerbehindertenausweisGenerator = new SchwerbehindertenausweisGenerator();