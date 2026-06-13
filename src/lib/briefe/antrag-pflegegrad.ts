// src/lib/briefe/antrag-pflegegrad.ts
// Antrag auf Pflegegrad (Erstbeantragung)
// PflegeNavigator EU - MDK-Begutachtung

import { ANTRAG_PFLEGEGRAD_PARAGRAPHEN } from '@/src/lib/briefe/constants';
import { BriefPayload } from '@/src/types/briefe';

export class AntragPflegegradGenerator {
  generateBrief(data: BriefPayload): string {
    const heute = new Date().toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    let brief = `${data.absender.name}\n`;
    brief += `${data.absender.strasse}\n`;
    brief += `${data.absender.plz} ${data.absender.ort}\n`;
    if (data.absender.telefon) brief += `Tel.: ${data.absender.telefon}\n`;
    if (data.absender.versichertennummer)
      brief += `Versicherten-Nr.: ${data.absender.versichertennummer}\n`;
    if (data.absender.geburtsdatum) brief += `Geburtsdatum: ${data.absender.geburtsdatum}\n`;

    brief += `\n\n\n`;
    brief += `${data.empfaenger.name}\n`;
    if (data.empfaenger.strasse) brief += `${data.empfaenger.strasse}\n`;
    brief += `${data.empfaenger.plz} ${data.empfaenger.ort}\n\n\n`;

    brief += `${data.absender.ort}, den ${heute}\n\n\n`;
    brief += `Betreff: ${data.betreff || 'Antrag auf Feststellung der Pflegebedürftigkeit nach § 14 SGB XI'}\n\n\n`;

    brief += `${data.inhalt.anrede}\n\n`;
    brief += `hiermit stelle ich formgerecht und fristwahrend einen Antrag auf Prüfung der Pflegebedürftigkeit und Einstufung in einen entsprechenden Pflegegrad gemäß § 14 Sozialgesetzbuch XI (SGB XI).\n\n`;

    brief += `Klinische Begründung der Einschränkungen im Alltag:\n`;
    brief += `${data.inhalt.hauptteil}\n\n`;

    brief += `Ich bitte um zeitnahe Weiterleitung dieses Vorgangs an den Medizinischen Dienst zur Terminierung der Begutachtung.\n\n`;

    brief += `Rechtliche Grundlagenhinweise:\n`;
    brief += `• ${ANTRAG_PFLEGEGRAD_PARAGRAPHEN.sgb_xi_14.paragraph}: ${ANTRAG_PFLEGEGRAD_PARAGRAPHEN.sgb_xi_14.text}\n`;
    brief += `• ${ANTRAG_PFLEGEGRAD_PARAGRAPHEN.sgb_xi_15.paragraph}: ${ANTRAG_PFLEGEGRAD_PARAGRAPHEN.sgb_xi_15.text}\n\n`;

    brief += `Mit freundlichen Grüßen\n\n\n`;
    brief += `_______________________\n`;
    brief += `${data.absender.name}\n`;

    // Standardisiertes Anlagenverzeichnis für die Pflegekasse
    brief += `\n\nAnlagen:\n`;
    brief += `- Kopie des Personalausweises\n`;
    brief += `- Vorhandene ärztliche Befundberichte / Entlassungsbriefe\n`;
    if (data.anlagen) {
      data.anlagen.forEach((anlage) => {
        brief += `- ${anlage}\n`;
      });
    }

    return brief;
  }
}

export const antragPflegegradGenerator = new AntragPflegegradGenerator();
