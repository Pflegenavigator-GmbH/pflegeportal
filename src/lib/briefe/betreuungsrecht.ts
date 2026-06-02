// src/lib/briefe/betreuungsrecht.ts
// Betreuungsrecht - Antrag auf Betreuung/Vorsorgevollmacht
// PflegeNavigator EU - Vorsorge für Pflegebedürftige

export interface BetreuungsrechtData {
  empfaenger: {
    name: string; // z.B. "Amtsgericht Bielefeld - Betreuungsgericht"
    strasse: string;
    plz: string;
    ort: string;
  };
  antragsteller: {
    name: string;
    strasse: string;
    plz: string;
    ort: string;
    telefon: string;
    geburtsdatum: string;
  };
  betroffene_person?: {
    name: string;
    geburtsdatum: string;
    wohnort: string;
    einwilligungsfaehig: boolean; // Kann selbst Vorsorgevollmacht erteilen?
  };
  verfahrensart: 'betreuung' | 'vorsorgevollmacht' | 'patientenverfuegung' | 'betreuung_ablehnung';
  betreuungsbereich?: ('vermoegen' | 'gesundheit' | 'aufenthalt' | 'post' | 'sonstiges')[];
  vorsorgebevollmaechtigter?: {
    name: string;
    verwandtschaftsverhaeltnis: string;
    telefon: string;
  };
  dringlichkeit?: 'normal' | 'hoch' | 'sehr_hoch';
  begruendung: string;
  anlagen?: string[];
}

export const BETREUUNGS_PARAGRAPHEN = {
  betreuungsrecht: {
    paragraph: "§§ 1896 ff. BGB",
    titel: "Betreuungsrecht",
    text: "Rechtliche Betreuung für volljährige Menschen bei Krankheit oder Behinderung",
  },
  vorsorgevollmacht: {
    paragraph: "§ 171 BGB",
    titel: "Vorsorgevollmacht",
    text: "Vorsorgevollmacht für den Fall der eigenen Einwilligungsunfähigkeit",
  },
  patientenverfuegung: {
    paragraph: "§ 1901a BGB",
    titel: "Patientenverfügung",
    text: "Verfügung über ärztliche Behandlung für den Fall der Einwilligungsunfähigkeit",
  },
  betreuungsverein: {
    paragraph: "§ 1908 BGB",
    titel: "Betreuungsverein",
    text: "Betreuungsverein als Betreuer bestellen",
  },
};

export class BetreuungsrechtGenerator {

  generateBrief(data: BetreuungsrechtData): string {
    const heute = new Date().toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const dringlichkeitText = this.getDringlichkeitText(data.dringlichkeit);

    let brief = `${data.antragsteller.name}
${data.antragsteller.strasse}
${data.antragsteller.plz} ${data.antragsteller.ort}
Tel.: ${data.antragsteller.telefon}


${data.empfaenger.name}
${data.empfaenger.strasse}
${data.empfaenger.plz} ${data.empfaenger.ort}


${data.antragsteller.ort}, den ${heute}


`;

    switch (data.verfahrensart) {
      case 'betreuung':
        brief += `Betreff: Antrag auf Bestellung eines Betreuers gemäß § 1896 BGB${dringlichkeitText}


Sehr geehrte Damen und Herren,

hiermit beantrage ich die Bestellung eines Betreuers für ${data.betroffene_person?.name}.


1. ANTRAGSBERECHTIGUNG

Ich bin ${data.betroffene_person?.einwilligungsfaehig ? 'selbst antragsberechtigt' : 'Angehöriger (Verwandter/Familienangehöriger)'} und wende mich an das Betreuungsgericht.


2. ANGABEN ZUR BETROFFENEN PERSON

Name: ${data.betroffene_person?.name}
Geburtsdatum: ${data.betroffene_person?.geburtsdatum}
Wohnort: ${data.betroffene_person?.wohnort}


3. BEGRÜNDUNG

${data.begruendung}


4. BEANTRAGTE BETREUUNGSBEREICHE

`;
        if (data.betreuungsbereich) {
          const bereichText: Record<string, string> = {
            vermoegen: 'Vermögenssorge (Konten, Verträge, Vermietung)',
            gesundheit: 'Gesundheitssorge (ärztliche Behandlung, Pflege)',
            aufenthalt: 'Aufenthaltsbestimmung (Wohnort, Umzug, Pflegeheim)',
            post: 'Post- und Telekommunikation',
            sonstiges: 'Sonstige Angelegenheiten'
          };
          data.betreuungsbereich.forEach(bereich => {
            brief += `- ${bereichText[bereich]}\n`;
          });
        }

        brief += `

5. VORGESCHLAGENER BETREUER

`;
        if (data.vorsorgebevollmaechtigter) {
          brief += `Ich schlage folgende Person als Betreuer vor:
Name: ${data.vorsorgebevollmaechtigter.name}
Verwandtschaftsverhältnis: ${data.vorsorgebevollmaechtigter.verwandtschaftsverhaeltnis}
Telefon: ${data.vorsorgebevollmaechtigter.telefon}

`;
        } else {
          brief += `Ich bitte das Gericht, einen geeigneten Betreuer zu bestellen.
`;
        }

        brief += `

Bitte bestätigen Sie mir den Eingang des Antrags und teilen Sie mir den Termin für ein Gerichtsgespräch mit.
`;
        break;

      case 'vorsorgevollmacht':
        brief += `Betreff: Notariell beglaubigte Vorsorgevollmacht erteilt


Sehr geehrte Damen und Herren,

hiermit teile ich mit, dass ich eine notariell beglaubigte Vorsorgevollmacht erteilt habe.


1. VOLLMACHTNEHMER

Name: ${data.vorsorgebevollmaechtigter?.name}
Verwandtschaftsverhältnis: ${data.vorsorgebevollmaechtigter?.verwandtschaftsverhaeltnis}
Telefon: ${data.vorsorgebevollmaechtigter?.telefon}


2. UMFANG DER VOLLMACHT

Die Vorsorgevollmacht umfasst:
`;
        if (data.betreuungsbereich) {
          const bereichText: Record<string, string> = {
            vermoegen: 'Vermögenssorge',
            gesundheit: 'Gesundheitssorge',
            aufenthalt: 'Aufenthaltsbestimmung',
            post: 'Post und Telekommunikation',
            sonstiges: 'Sonstige Angelegenheiten'
          };
          data.betreuungsbereich.forEach(bereich => {
            brief += `- ${bereichText[bereich]}\n`;
          });
        }
        brief += `

Die Vorsorgevollmacht ist beim Notar ${data.empfaenger.name} hinterlegt.
`;
        break;

      case 'patientenverfuegung':
        brief += `Betreff: Patientenverfügung hinterlegt gemäß § 1901a BGB


Sehr geehrte Damen und Herren,

hiermit teile ich mit, dass ich eine Patientenverfügung erstellt habe.


1. INHALT DER PATIENTENVERFÜGUNG

${data.begruendung}


2. BEHANDLUNGSVERFÜGUNGEN

`;
        if (data.betreuungsbereich) {
          brief += `Die Patientenverfügung enthält folgende Regelungen:\n`;
          data.betreuungsbereich.forEach(bereich => {
            if (bereich === 'gesundheit') brief += `- Verzicht auf lebensverlängernde Maßnahmen\n`;
            if (bereich === 'sonstiges') brief += `- Palliativmedizinische Versorgung gewünscht\n`;
          });
        }
        brief += `

Die Patientenverfügung liegt meinem behandelnden Arzt vor und ist in der Patientenakte vermerkt.
`;
        break;
    }

    brief += `


Mit freundlichen Grüßen


_______________________
${data.antragsteller.name}


Anlagen:
`;

    const standardAnlagen = [
      "Kopie des Personalausweises",
      "Ärztliche Atteste (bei Betreuungsantrag)",
      "Vorsorgevollmacht (beglaubigt, bei Vollmacht)"
    ];

    const alleAnlagen = [...standardAnlagen, ...(data.anlagen || [])];
    alleAnlagen.forEach((anlage, index) => {
      brief += `${index + 1}. ${anlage}\n`;
    });

    brief += `


HINWEIS:
Betreuungsverfahren sind im Betreuungsgerichtsverfahrensgesetz (Betreuungsg.-Verf.) geregelt.
Bei dringenden Gesundheitsgefahren kann das Gericht sofort einen vorläufigen Betreuer bestellen.
`;

    return brief;
  }

  private getDringlichkeitText(dringlichkeit?: string): string {
    switch (dringlichkeit) {
      case 'sehr_hoch': return '\n\n*** DRINGEND - SOFORTIGE BESTELLUNG ERFORDERLICH ***';
      case 'hoch': return '\n\n*Eilbedürftig*';
      default: return '';
    }
  }

  // Schnell-Generator für Vorsorgevollmacht
  generateVorsorgevollmacht(
    vollmachtgeber: { name: string; strasse: string; plz: string; ort: string; telefon: string },
    bevollmaechtigter: { name: string; verwandtschaftsverhaeltnis: string; telefon: string }
  ): string {
    return this.generateBrief({
      empfaenger: {
        name: "Notar",
        strasse: "[Adresse eintragen]",
        plz: "[PLZ]",
        ort: "[Ort]"
      },
      antragsteller: {
        ...vollmachtgeber,
        geburtsdatum: '[TT.MM.JJJJ]'
      },
      verfahrensart: 'vorsorgevollmacht',
      begruendung: 'Vorsorge für den Fall der eigenen Einwilligungsunfähigkeit',
      vorsorgebevollmaechtigter: bevollmaechtigter,
      betreuungsbereich: ['vermoegen', 'gesundheit', 'aufenthalt']
    });
  }
}

export const betreuungsrechtGenerator = new BetreuungsrechtGenerator();
