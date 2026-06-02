// src/lib/pflegegrad/nba-modules.ts
// NBA-Module Berechnung nach § 14 SGB XI
// PflegeNavigator EU - Kernberechnung

export interface NBAModule {
  id: number;
  name: string;
  gewichtung: number; // Prozent
  punkte: number; // 0-100 Rohpunkte
  beschreibung: string;
}

export const NBA_MODULE: NBAModule[] = [
  {
    id: 1,
    name: "Mobilität",
    gewichtung: 0.10,
    punkte: 0,
    beschreibung: "Fähigkeit, sich im Raum zu bewegen, zu laufen, Treppen zu steigen"
  },
  {
    id: 2,
    name: "Kognition & Kommunikation",
    gewichtung: 0.15,
    punkte: 0,
    beschreibung: "Orientierung, Erinnern, Entscheiden, Kommunizieren"
  },
  {
    id: 3,
    name: "Verhaltensweisen & Psyche",
    gewichtung: 0.15,
    punkte: 0,
    beschreibung: "Umgang mit belastendem Verhalten, psychische Erkrankungen"
  },
  {
    id: 4,
    name: "Selbstversorgung",
    gewichtung: 0.40,
    punkte: 0,
    beschreibung: "Körperpflege, Essen, Trinken, Toilette, Anziehen (HÖCHSTE GEWICHTUNG)"
  },
  {
    id: 5,
    name: "Krankheitsbewältigung",
    gewichtung: 0.20,
    punkte: 0,
    beschreibung: "Medikamente nehmen, ärztliche Anordnungen umsetzen, Therapien"
  },
  {
    id: 6,
    name: "Alltagsgestaltung",
    gewichtung: 0.00,
    punkte: 0,
    beschreibung: "Haushalt führen (nicht für Pflegegrad, aber relevant für Widerspruch)"
  }
];

// Pflegegrad-Schwellen nach SGB XI
export const PFLEGEGRAD_SCHWELLEN = {
  1: { min: 12.5, max: 27, schwelle: 12.5 },
  2: { min: 27, max: 47.5, schwelle: 27 },
  3: { min: 47.5, max: 70, schwelle: 47.5 },
  4: { min: 70, max: 90, schwelle: 70 },
  5: { min: 90, max: 100, schwelle: 90 }
};

export interface PflegegradErgebnis {
  pflegegrad: 0 | 1 | 2 | 3 | 4 | 5;
  gesamtpunkte: number;
  ampel: 'gruen' | 'gelb' | 'rot';
  pufferPunkte: number;
  modulErgebnisse: {
    modulId: number;
    name: string;
    rohpunkte: number;
    gewichtetePunkte: number;
  }[];
  empfehlungen: string[];
}

export class PflegegradRechner {
  
  berechnePflegegrad(module: { modulId: number; punkte: number }[]): PflegegradErgebnis {
    // Modul 2 und 3: Nur der HÖHERE Wert zählt!
    const modul2 = module.find(m => m.modulId === 2);
    const modul3 = module.find(m => m.modulId === 3);
    
    let kognitionPunkte = 0;
    if (modul2 && modul3) {
      kognitionPunkte = Math.max(modul2.punkte, modul3.punkte);
    } else if (modul2) {
      kognitionPunkte = modul2.punkte;
    } else if (modul3) {
      kognitionPunkte = modul3.punkte;
    }

    // Berechnung
    const ergebnisse = module.map(m => {
      const modulDef = NBA_MODULE.find(def => def.id === m.modulId);
      if (!modulDef) return null;

      // Spezialfall: Modul 2 oder 3
      if (m.modulId === 2 || m.modulId === 3) {
        const punkte = m.modulId === 2 ? kognitionPunkte : 0; // Nur Modul 2 zählt offiziell
        return {
          modulId: m.modulId,
          name: modulDef.name,
          rohpunkte: m.punkte,
          gewichtetePunkte: m.modulId === 2 ? punkte * modulDef.gewichtung : 0
        };
      }

      return {
        modulId: m.modulId,
        name: modulDef.name,
        rohpunkte: m.punkte,
        gewichtetePunkte: m.punkte * modulDef.gewichtung
      };
    }).filter(Boolean) as PflegegradErgebnis['modulErgebnisse'];

    // Gesamtpunkte (nur Module 1, 2/3, 4, 5)
    const gesamtpunkte = ergebnisse
      .filter(e => e.modulId !== 6) // Modul 6 nicht für Pflegegrad
      .reduce((sum, e) => sum + e.gewichtetePunkte, 0);

    // Pflegegrad bestimmen
    let pflegegrad: 0 | 1 | 2 | 3 | 4 | 5 = 0;
    if (gesamtpunkte >= 90) pflegegrad = 5;
    else if (gesamtpunkte >= 70) pflegegrad = 4;
    else if (gesamtpunkte >= 47.5) pflegegrad = 3;
    else if (gesamtpunkte >= 27) pflegegrad = 2;
    else if (gesamtpunkte >= 12.5) pflegegrad = 1;

    // Ampel-Logik
    const aktuelleSchwelle = pflegegrad > 0 ? PFLEGEGRAD_SCHWELLEN[pflegegrad as 1|2|3|4|5].schwelle : 0;
    const pufferPunkte = gesamtpunkte - aktuelleSchwelle;
    
    let ampel: 'gruen' | 'gelb' | 'rot';
    if (pflegegrad === 0) {
      ampel = 'rot';
    } else if (pufferPunkte > 5) {
      ampel = 'gruen';
    } else if (pufferPunkte >= 0) {
      ampel = 'gelb';
    } else {
      ampel = 'rot';
    }

    // Empfehlungen
    const empfehlungen = this.generiereEmpfehlungen(pflegegrad, ampel);

    return {
      pflegegrad,
      gesamtpunkte,
      ampel,
      pufferPunkte,
      modulErgebnisse: ergebnisse,
      empfehlungen
    };
  }

  private generiereEmpfehlungen(pflegegrad: number, ampel: string): string[] {
    const empfehlungen: string[] = [];

    if (pflegegrad === 0) {
      empfehlungen.push("Ihr Ergebnis reicht noch nicht für einen Pflegegrad.");
      empfehlungen.push("Empfohlen: Wiederholen Sie die Begutachtung in 6 Monaten bei Verschlechterung.");
    } else if (pflegegrad >= 1 && pflegegrad <= 2) {
      empfehlungen.push("Sie haben Anspruch auf Pflegegeld und Beratung nach § 37 Abs. 3 SGB XI.");
      empfehlungen.push("Empfohlen: Pflegekurs für Angehörige (4× pro Pflegegrad möglich).");
    } else if (pflegegrad >= 3) {
      empfehlungen.push("Sie haben Anspruch auf Pflegegeld, Sachleistungen oder Kombinationsleistungen.");
      empfehlungen.push("Möglich: Entlastungsbetrag (600€/Jahr), Kurzzeitpflege (bis zu 4×/Jahr).");
    }

    if (ampel === 'gelb') {
      empfehlungen.push("⚠️ Ihr Ergebnis ist knapp - bei Verschlechterung Widerspruch/Wiederholung prüfen.");
    }

    if (pflegegrad >= 3) {
      empfehlungen.push("💡 Tipp: Prüfen Sie zusätzlich den Antrag auf Schwerbehindertenausweis (GdB 50+).");
    }

    return empfehlungen;
  }

  // Hilfsfunktion: Modul-Fragen vorschlagen
  getModulFragen(modulId: number): string[] {
    const fragen: Record<number, string[]> = {
      1: [
        "Können Sie selbstständig aufstehen und sich fortbewegen?",
        "Benötigen Sie Hilfe beim Gehen oder Stehen?",
        "Können Sie Treppen steigen?",
        "Sind Sie auf einen Rollstuhl angewiesen?"
      ],
      2: [
        "Wissen Sie immer, wo Sie sind (Orientierung)?",
        "Können Sie sich an aktuelle Ereignisse erinnern?",
        "Können Sie komplexe Entscheidungen treffen?",
        "Verstehen Sie Gespräche und können antworten?"
      ],
      3: [
        "Gibt es belastendes Verhalten (z.B. herumlaufen, rufen)?",
        "Sind psychische Erkrankungen vorhanden (Depression, Demenz)?",
        "Besteht Suizidgefährdung oder Verwirrtheit?",
        "Benötigen Sie psychologische Unterstützung?"
      ],
      4: [
        "Können Sie sich selbst waschen und duschen?",
        "Können Sie sich allein an- und ausziehen?",
        "Können Sie selbstständig essen und trinken?",
        "Können Sie die Toilette allein benutzen?",
        "Können Sie Ihre Medikamente selbst einnehmen?"
      ],
      5: [
        "Können Sie Medikamente pünktlich nehmen?",
        "Können Sie sich selbst spritzen/verbinden?",
        "Können Sie ärztliche Anordnungen umsetzen?",
        "Benötigen Sie Hilfe bei Therapien?"
      ],
      6: [
        "Können Sie den Haushalt allein führen?",
        "Können Sie einkaufen gehen?",
        "Können Sie kochen und aufräumen?",
        "Benötigen Sie Hilfe bei Geldangelegenheiten?"
      ]
    };

    return fragen[modulId] || [];
  }
}

export const pflegegradRechner = new PflegegradRechner();
