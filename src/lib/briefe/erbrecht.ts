// src/lib/briefe/erbrecht.ts
// Erbrecht - Testament, Pflichtteil, Erbschaftsteuer
// PflegeNavigator EU - Vorsorge bei Pflegebedürftigkeit

export interface ErbrechtData {
  empfaenger: {
    name: string; // Notar oder Amtsgericht
    strasse: string;
    plz: string;
    ort: string;
  };
  erblasser: {
    name: string;
    strasse: string;
    plz: string;
    ort: string;
    telefon: string;
    geburtsdatum: string;
    familienstand: 'ledig' | 'verheiratet' | 'geschieden' | 'verwitwet';
    kirchensteuer?: boolean;
  };
  verfahrensart: 'testament' | 'pflichtteil' | 'erbschaftsteuer' | 'vorweggenommene_erbschaft' | 'erbschaftsausgleich';
  erben: {
    name: string;
    verwandtschaftsgrad: string; // z.B. "Tochter", "Sohn", "Enkel"
    vermoegensanteil?: number; // Prozent
    pflichtteilsberechtigt?: boolean;
  }[];
  vermoegen: {
    immobilien?: number;
    bankguthaben?: number;
    wertpapiere?: number;
    sonstiges?: number;
    gesamtwert?: number;
  };
  testament_details?: {
    eigenhaendig: boolean;
    notariell_beglaubigt: boolean;
    letzter_wille?: string;
    enterbung?: string[]; // Namen der Enterbten
    besondere_verfuegungen?: string[];
  };
  begruendung?: string;
  anlagen?: string[];
}

export const ERBRECHT_PARAGRAPHEN = {
  erbfolge: {
    paragraph: "§§ 1922 ff. BGB",
    titel: "Gesetzliche Erbfolge",
    text: "Wenn kein Testament vorhanden ist, erben Ehegatte und Kinder nach gesetzlicher Erbfolge",
  },
  pflichtteil: {
    paragraph: "§§ 2303 ff. BGB",
    titel: "Pflichtteil",
    text: "Abkömmlinge, Eltern und Ehegatten haben Anspruch auf Pflichtteil (50% des gesetzlichen Erbteils)",
  },
  enterbung: {
    paragraph: "§ 2333 BGB",
    titel: "Enterbung",
    text: "Enterbung nur bei schwerwiegenden Gründen (z.B. vorsätzliche Körperverletzung)",
  },
  erbschaftsteuer: {
    paragraph: "§ 1 ErbStG",
    titel: "Erbschaftsteuer",
    text: "Schenkungen und Erbschaften unterliegen der Erbschaftsteuer mit Freibeträgen",
  },
  freibetraege: {
    paragraph: "§ 16 ErbStG",
    titel: "Freibeträge",
    text: "Ehegatte: 500.000€, Kinder: 400.000€, Enkel: 200.000€",
  },
};

export class ErbrechtGenerator {

  generateBrief(data: ErbrechtData): string {
    const heute = new Date().toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    let brief = `${data.erblasser.name}
${data.erblasser.strasse}
${data.erblasser.plz} ${data.erblasser.ort}
Tel.: ${data.erblasser.telefon}
Geb.: ${data.erblasser.geburtsdatum}


${data.empfaenger.name}
${data.empfaenger.strasse}
${data.empfaenger.plz} ${data.empfaenger.ort}


${data.erblasser.ort}, den ${heute}


`;

    switch (data.verfahrensart) {
      case 'testament':
        brief += `Betreff: Notarielle Beurkundung eines Testaments


Sehr geehrte Damen und Herren,

hiermit bitte ich um notarielle Beurkundung meines Testaments.


1. PERSÖNLICHE VERHÄLTNISSE

Name: ${data.erblasser.name}
Geburtsdatum: ${data.erblasser.geburtsdatum}
Familienstand: ${data.erblasser.familienstand}
${data.erblasser.kirchensteuer ? 'Kirchensteuerpflichtig: Ja' : ''}


2. VERMÖGEN

`;
        if (data.vermoegen.gesamtwert) {
          brief += `Geschätztes Gesamtvermögen: ${data.vermoegen.gesamtwert.toLocaleString('de-DE')} EUR

`;
        }
        if (data.vermoegen.immobilien) {
          brief += `Immobilienvermögen: ${data.vermoegen.immobilien.toLocaleString('de-DE')} EUR
`;
        }
        if (data.vermoegen.bankguthaben) {
          brief += `Bankguthaben: ${data.vermoegen.bankguthaben.toLocaleString('de-DE')} EUR
`;
        }
        if (data.vermoegen.wertpapiere) {
          brief += `Wertpapiere: ${data.vermoegen.wertpapiere.toLocaleString('de-DE')} EUR
`;
        }
        
        brief += `

3. VERERBUNGSWÜNSCHE

Ich bestimme hiermit folgende Erbfolge:

`;
        data.erben.forEach((erbe, index) => {
          brief += `${index + 1}. ${erbe.name} (${erbe.verwandtschaftsgrad})`;
          if (erbe.vermoegensanteil) {
            brief += `: ${erbe.vermoegensanteil}%`;
          }
          if (erbe.pflichtteilsberechtigt) {
            brief += ` - Pflichtteilsberechtigt`;
          }
          brief += `
`;
        });

        if (data.testament_details?.enterbung && data.testament_details.enterbung.length > 0) {
          brief += `

4. ENTERBUNG

Folgende Personen sind enterbt:
`;
          data.testament_details.enterbung.forEach(person => {
            brief += `- ${person}
`;
          });
          brief += `
Begründung: ${data.testament_details.letzter_wille || 'Siehe gesonderte Begründung'}
`;
        }

        if (data.testament_details?.besondere_verfuegungen && data.testament_details.besondere_verfuegungen.length > 0) {
          brief += `

5. BESONDERE VERFÜGUNGEN

`;
          data.testament_details.besondere_verfuegungen.forEach(verfuegung => {
            brief += `- ${verfuegung}
`;
          });
        }

        brief += `

6. HINWEIS ZUR NOTWENDIGEN BEURKUNDUNG

Nach § 2247 BGB muss ein Testament eigenhändig geschrieben und unterschrieben werden (nicht bei Beurkundung beim Notar).
Bei notarieller Beurkundung (§ 2232 BGB) ist keine eigenhändige Schrift erforderlich.
`;
        break;

      case 'pflichtteil':
        brief += `Betreff: Pflichtteilsgeltendmachung / Anspruch auf Pflichtteil


Sehr geehrte Damen und Herren,

hiermit mache ich meinen Pflichtteilsgeltendmachungsanspruch geltend.


1. TODESFALL

Name des Erblassers/Erblasserin: [Name eintragen]
Datum des Todes: [TT.MM.JJJJ]


2. ERBMASSE

`;
        if (data.vermoegen.gesamtwert) {
          brief += `Geschätzte Erbschaftsmasse: ${data.vermoegen.gesamtwert.toLocaleString('de-DE')} EUR

`;
        }
        
        brief += `3. PFLICHTTEILSBERECHTIGUNG

Als [Verwandtschaftsgrad] des/der Verstorbenen bin ich pflichtteilsberechtigt nach § 2303 BGB.
Mein Pflichtteil beträgt 50% des gesetzlichen Erbteils.


4. BERECHNUNG

Gesetzlicher Erbteil: [Prozent]%
Pflichtteil (50% davon): [Prozent]%
Anspruchsbetrag: [Betrag] EUR


Ich bitte um Mitteilung des Nachlassinventars und Auszahlung meines Pflichtteils.
`;
        break;

      case 'erbschaftsteuer':
        brief += `Betreff: Erbschaftsteuererklärung


Sehr geehrte Damen und Herren,

hiermit reiche ich meine Erbschaftsteuererklärung ein.


1. ERWERB VON TODES WEGEN

Erblasser: [Name eintragen]
Datum des Todes: [TT.MM.JJJJ]


2. ANSPRUCH AUS ERBRECHT

Als [Verwandtschaftsgrad] bin ich gesetzlich erbberechtigt.
Mein Erbanteil beträgt [Prozent]% des Nachlasses.


3. STEUERBARE ERBSCHAFT

Bruttoerbschaft: ${data.vermoegen.gesamtwert?.toLocaleString('de-DE') || '[Betrag]'} EUR
Abzüge (Schulden, Bestattungskosten): [Betrag] EUR
Steuerpflichtige Erbschaft: [Betrag] EUR


4. FREIBETRAG

Persönlicher Freibetrag: [Betrag] EUR (§ 16 ErbStG)
Verwendeter Freibetrag: [Betrag] EUR
Verbleibende Steuerpflicht: [Betrag] EUR


Bitte bestätigen Sie den Erhalt und teilen Sie mir die zu entrichtende Erbschaftsteuer mit.
`;
        break;

      case 'vorweggenommene_erbschaft':
        brief += `Betreff: Schenkung / Vorweggenommene Erbfolge


Sehr geehrte Damen und Herren,

hiermit bitte ich um notarielle Beurkundung einer Schenkung.


1. SCHENKUNG

Schenkender: ${data.erblasser.name}
Adresse: ${data.erblasser.strasse}, ${data.erblasser.plz} ${data.erblasser.ort}

Beschenkte/r: ${data.erben[0]?.name || '[Name eintragen]'}
Verwandtschaftsverhältnis: ${data.erben[0]?.verwandtschaftsgrad || '[Verwandtschaftsgrad]'}


2. GEGENSTAND DER SCHENKUNG

Art der Schenkung: [Immobilie / Bargeld / Wertpapiere / sonstiges]
Wert: ${data.vermoegen.gesamtwert?.toLocaleString('de-DE') || '[Betrag]'} EUR


3. HINWEIS ZUR PFLICHTTEILSBERECHNUNG

Bei Schenkungen unter Lebenden ist eine spätere Pflichtteilsergänzung gemäß § 2325 BGB möglich.
Der Wert wird bei späterer Erbfolge berücksichtigt.


Bitte beurkunden Sie die Schenkung und berechnen Sie die Schenkungsteuer.
`;
        break;
    }

    brief += `


Mit freundlichen Grüßen


_______________________
${data.erblasser.name}


Anlagen:
`;

    const standardAnlagen = [
      "Kopie des Personalausweises",
      "Familienstands-/Geburtsurkunden",
      "Vermögensnachweise (bei Testament)",
      "Sterbeurkunde (bei Erbschaft)",
    ];

    const alleAnlagen = [...standardAnlagen, ...(data.anlagen || [])];
    alleAnlagen.forEach((anlage, index) => {
      brief += `${index + 1}. ${anlage}
`;
    });

    brief += `


HINWEIS:
Erbrechtliche Beratung ist besonders bei größeren Vermögen empfohlen.
Die gesetzlichen Erbfolge ist abzulösen durch letztwillige Verfügung (Testament/Erbvertrag).
`;

    return brief;
  }

  // Schnell-Generator für Testament
  generateTestament(
    erblasser: { name: string; strasse: string; plz: string; ort: string; telefon: string; geburtsdatum: string },
    erben: { name: string; verwandtschaftsgrad: string; vermoegensanteil?: number }[],
    gesamtvermoegen: number
  ): string {
    return this.generateBrief({
      empfaenger: {
        name: "Notar",
        strasse: "[Adresse eintragen]",
        plz: "[PLZ]",
        ort: "[Ort]"
      },
      erblasser: {
        ...erblasser,
        familienstand: 'verheiratet',
      },
      verfahrensart: 'testament',
      erben,
      vermoegen: { gesamtwert: gesamtvermoegen },
      testament_details: {
        eigenhaendig: false,
        notariell_beglaubigt: true,
      }
    });
  }
}

export const erbrechtGenerator = new ErbrechtGenerator();
