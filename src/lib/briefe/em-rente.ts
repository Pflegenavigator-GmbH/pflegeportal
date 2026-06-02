// src/lib/briefe/em-rente.ts
// Brief-Generator für Erwerbsminderungsrente (EM-Rente)
// PflegeNavigator EU - Rentenversicherung Briefe

export interface EMRenteData {
  empfaenger: {
    name: string;  // z.B. "Deutsche Rentenversicherung Bund"
    strasse: string;
    plz: string;
    ort: string;
    bearbeitungsnummer?: string;
  };
  antragsteller: {
    name: string;
    strasse: string;
    plz: string;
    ort: string;
    geburtsdatum: string;
    sozialversicherungsnummer: string;
    telefon?: string;
    email?: string;
  };
  krankheit: {
    diagnose: string;
    icd10?: string;
    behandelnder_arzt: string;
    krank_seit: string;  // Korrigiert: Unterstrich statt Leerzeichen
    voraussichtlich_bis?: string;
  };
  arbeitgeber?: {
    name: string;
    eingetreten_seit: string;
    letzter_arbeitstag: string;
  };
  rentenart: 'volle' | 'teilweise' | 'vorlaeufige' | 'berufsunfaehigkeit';
  dringlichkeit?: 'normal' | 'hoch';
  unterlagen: string[];
}

// Muster-Vorlagen für EM-Rente
export const EM_VORLAGEN = {
  em_rente_antrag: {
    betreff: "Antrag auf Erwerbsminderungsrente",
    einleitung: "hiermit stelle ich Antrag auf Erwerbsminderungsrente gemäß § 240 SGB VI.",
    paragraphen: ["§ 240 SGB VI", "§ 43 SGB VI"],
  },
  berufsunfaehigkeit: {
    betreff: "Antrag auf Berufsunfähigkeitsrente",
    einleitung: "hiermit stelle ich Antrag auf Berufsunfähigkeitsrente gemäß § 240 SGB VI.",
    paragraphen: ["§ 240 SGB VI", "§ 237 SGB VI"],
  },
  vorlaeufige_em: {
    betreff: "Antrag auf vorläufige Erwerbsminderungsrente",
    einleitung: "hiermit stelle ich Antrag auf vorläufige Erwerbsminderungsrente gemäß § 241 SGB VI.",
    paragraphen: ["§ 241 SGB VI"],
  },
  widerspruch_leistung: {
    betreff: "Widerspruch gegen Leistungsbescheid",
    einleitung: "lege ich hiermit fristgerecht Widerspruch ein gegen den Bescheid vom {datum}.",
    paragraphen: ["§ 78 SGB X"],
  },
  nachzahlung: {
    betreff: "Antrag auf Rentennachzahlung",
    einleitung: "hiermit beantrage ich eine Überprüfung und Nachzahlung meiner Rente.",
    paragraphen: ["§ 44 SGB VI"],
  },
  widerspruch_mdl: {
    betreff: "Widerspruch gegen medizinisches Gutachten",
    einleitung: "lege ich hiermit Widerspruch ein gegen das medizinische Gutachten vom {datum}.",
    paragraphen: ["§ 78 SGB X", "§ 109 SGB X"],
  }
};

export class EMRenteBriefGenerator {

  generateBrief(data: EMRenteData): string {
    const heute = new Date().toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const vorlage = this.getVorlage(data.rentenart);
    const dringlichkeit = data.dringlichkeit === 'hoch' ? '\\n\\n*Eilbedürftig - Krankengeld läuft ab*' : '';

    return `\\
${data.antragsteller.name}\\
${data.antragsteller.strasse}\\
${data.antragsteller.plz} ${data.antragsteller.ort}\\
\\
\\
${data.empfaenger.name}\\
${data.empfaenger.strasse}\\
${data.empfaenger.plz} ${data.empfaenger.ort}\\
${data.empfaenger.bearbeitungsnummer ? `\\nBearbeitungs-Nr.: ${data.empfaenger.bearbeitungsnummer}` : ''}\\
\\
\\
${data.antragsteller.ort}, den ${heute}\\
\\
\\
Betreff: ${vorlage.betreff}${dringlichkeit}\\
\\
\\
Sehr geehrte Damen und Herren,\\
\\
${vorlage.einleitung}\\
\\
Persönliche Daten:\\
- Name: ${data.antragsteller.name}\\
- Geboren: ${data.antragsteller.geburtsdatum}\\
- SV-Nummer: ${data.antragsteller.sozialversicherungsnummer}\\
\\
Krankheitsbild:\\
- Diagnose: ${data.krankheit.diagnose}${data.krankheit.icd10 ? ` (ICD-10: ${data.krankheit.icd10})` : ''}\\
- Behandelnder Arzt: ${data.krankheit.behandelnder_arzt}\\
- Krank seit: ${data.krankheit.krank_seit}\\
${data.krankheit.voraussichtlich_bis ? `- Voraussichtlich bis: ${data.krankheit.voraussichtlich_bis}` : ''}\\
\\
${this.generateArbeitgeberSection(data)}\\
\\
${this.generateRenteDetails(data)}\\
\\
Begründung:\\
Aufgrund meiner gesundheitlichen Einschränkungen bin ich derzeit nicht in der Lage, meinen Beruf auszuüben.\\
\\
Die Erkrankung beeinträchtigt folgende berufliche Fähigkeiten:\\
- [ ] Körperliche Belastbarkeit\\
- [ ] Konzentrationsfähigkeit\\
- [ ] Stressresistenz\\
- [ ] Mobilität\\
- [ ] Weitere: _______________\\
\\
Ich bitte um zügige Bearbeitung meines Antrags und Terminierung eines medizinischen Gutachtens.\\
\\
\\
Mit freundlichen Grüßen\\
\\
\\
_______________________\\
${data.antragsteller.name}\\
\\
\\
Anlagen:\\
- Personalausweis (Kopie)\\
${data.unterlagen.map(u => `- ${u}`).join("\\n")}\\
\\
\\
Kontakt:\\
${data.antragsteller.telefon ? `Tel.: ${data.antragsteller.telefon}` : ''}\\
${data.antragsteller.email ? `E-Mail: ${data.antragsteller.email}` : ''}\\
`;
  }

  private getVorlage(rentenart: string) {
    switch(rentenart) {
      case 'berufsunfaehigkeit': return EM_VORLAGEN.berufsunfaehigkeit;
      case 'vorlaeufige': return EM_VORLAGEN.vorlaeufige_em;
      default: return EM_VORLAGEN.em_rente_antrag;
    }
  }

  private generateArbeitgeberSection(data: EMRenteData): string {
    if (!data.arbeitgeber) return '';
    
    return `Arbeitgeber:\\
- Firma: ${data.arbeitgeber.name}\\
- Eingetreten seit: ${data.arbeitgeber.eingetreten_seit}\\
- Letzter Arbeitstag: ${data.arbeitgeber.letzter_arbeitstag}\\
- Derzeit: Krankgeschrieben`;
  }

  private generateRenteDetails(data: EMRenteData): string {
    let text = "\\nGewünschte Rentenart:\\n";
    
    switch(data.rentenart) {
      case 'volle':
        text += "- Volle Erwerbsminderungsrente (mindestens 6 Stunden täglich nicht arbeitsfähig)";
        break;
      case 'teilweise':
        text += "- Teilweise Erwerbsminderungsrente (3-6 Stunden täglich arbeitsfähig)";
        break;
      case 'vorlaeufige':
        text += "- Vorläufige Erwerbsminderungsrente (Heilungsaussicht ungewiss)";
        break;
      case 'berufsunfaehigkeit':
        text += "- Berufsunfähigkeitsrente (nicht mehr im erlernten Beruf tätig)";
        break;
    }
    
    return text;
  }

  // AI-Verbesserung
  async enhanceMitAI(baseBrief: string, anweisung: string): Promise<string> {
    return `${baseBrief}\\n\\n---\\nAI-Optimierung: ${anweisung}`;
  }

  // Gutachten-Vorbereitung
  generateGutachtenFragen(): string[] {
    return [
      "Welche Tätigkeiten können Sie noch ausführen?",
      "Welche Beschwerden haben Sie bei körperlicher Belastung?",
      "Wie lange können Sie konzentriert arbeiten?",
      "Gibt es Tageszeiten mit weniger Beschwerden?",
      "Benötigen Sie Pausen? Wie oft und wie lange?",
      "Können Sie sich ohne Hilfe fortbewegen?",
      "Benötigen Sie Hilfe im Haushalt?"
    ];
  }
}

export const emRenteGenerator = new EMRenteBriefGenerator();
