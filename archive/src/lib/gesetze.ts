// src/lib/gesetze.ts
// GESETZE API - BundesAPI (Kostenlos) + Normattiva (Fallback)
// EU-konform, Deutsche Gesetze, SGB XI, SGB V, etc.

const BUNDESAPI_BASE = "https://raw.githubusercontent.com/bundesAPI/gesetze/main/data";
const NORMATTIVA_BASE = "https://api.normattiva.de/v1";

export interface Gesetz {
  abbreviation: string;
  title: string;
  sections: Section[];
}

export interface Section {
  number: string;
  title: string;
  content: string;
  amended?: string;
}

// ============================================
// SGB XI - Pflegeversicherung
// ============================================
export async function getSGBXI(paragraph?: string): Promise<Gesetz | null> {
  try {
    // BundesAPI (kostenlos, Open Source)
    const url = paragraph 
      ? `${BUNDESAPI_BASE}/sgb_11/${paragraph}.json`
      : `${BUNDESAPI_BASE}/sgb_11/index.json`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("BundesAPI nicht verfügbar");
    
    return await response.json();
  } catch (error) {
    console.error("Fehler beim Laden SGB XI:", error);
    
    // Fallback: Normattiva (0,10€/Abruf)
    return await getFromNormattiva("SGBXI", paragraph);
  }
}

// ============================================
// SGB V - Krankenversicherung
// ============================================
export async function getSGBV(paragraph?: string): Promise<Gesetz | null> {
  try {
    const url = paragraph
      ? `${BUNDESAPI_BASE}/sgb_5/${paragraph}.json`
      : `${BUNDESAPI_BASE}/sgb_5/index.json`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("BundesAPI nicht verfügbar");
    
    return await response.json();
  } catch (error) {
    console.error("Fehler beim Laden SGB V:", error);
    return await getFromNormattiva("SGBV", paragraph);
  }
}

// ============================================
// SGB IX - Rehabilitation (GdB)
// ============================================
export async function getSGBIX(paragraph?: string): Promise<Gesetz | null> {
  try {
    const url = paragraph
      ? `${BUNDESAPI_BASE}/sgb_9/${paragraph}.json`
      : `${BUNDESAPI_BASE}/sgb_9/index.json`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("BundesAPI nicht verfügbar");
    
    return await response.json();
  } catch (error) {
    console.error("Fehler beim Laden SGB IX:", error);
    return await getFromNormattiva("SGBIX", paragraph);
  }
}

// ============================================
// Pflegegeld-Beträge 2026 (Aktuell)
// ============================================
export const PFLEGEGELD_2026 = {
  pg1: { monthly: 0, reliefBudget: 131, name: "Pflegegrad 1" },
  pg2: { monthly: 347, reliefBudget: 131, name: "Pflegegrad 2" },
  pg3: { monthly: 599, reliefBudget: 131, name: "Pflegegrad 3" },
  pg4: { monthly: 800, reliefBudget: 131, name: "Pflegegrad 4" },
  pg5: { monthly: 990, reliefBudget: 131, name: "Pflegegrad 5" },
  // Zusätzliche Leistungen
  entlastungsBudget: 3539, // € pro Jahr (Verhinderungspflege + Tagespflege)
  pflegehilfsmittel: 42, // €/Monat
  wohnraumanpassung: 4180, // € einmalig
};

// ============================================
// BEEP Gesetz 2026 (Aktuell)
// ============================================
export const BEEP_2026 = {
  name: "BEEP - Befugniserweiterung und Entbürokratisierung in der Pflege",
  effectiveDate: "2026-01-01",
  keyChanges: [
    "Kürzere Abrechnungsfristen für Pflegedienste",
    "Weniger Bürokratie bei Verhinderungspflege",
    "Präventionsangebote erweitert",
    "Heilkundliche Aufgaben in Pflege verankert"
  ]
};

// ============================================
// Fallback: Normattiva API
// ============================================
async function getFromNormattiva(gesetz: string, paragraph?: string): Promise<Gesetz | null> {
  const apiKey = process.env.NORMATTIVA_API_KEY;
  
  if (!apiKey) {
    console.warn("Normattiva API Key nicht konfiguriert");
    return null;
  }
  
  try {
    const url = paragraph
      ? `${NORMATTIVA_BASE}/gesetze/${gesetz}/paragraph/${paragraph}?api_key=${apiKey}`
      : `${NORMATTIVA_BASE}/gesetze/${gesetz}?api_key=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("Normattiva nicht verfügbar");
    
    return await response.json();
  } catch (error) {
    console.error("Auch Normattiva fehlgeschlagen:", error);
    return null;
  }
}

// ============================================
// Hilfsfunktion: Pflegegrad-Leistungen berechnen
// ============================================
export function calculateBenefits(
  careLevel: number,
  hasReliefBudget: boolean = false,
  hasCombinationBenefits: boolean = false
): { total: number; details: string[] } {
  const pgKey = `pg${careLevel}` as const;
  const pgData = PFLEGEGELD_2026[pgKey as keyof typeof PFLEGEGELD_2026];
  const baseAmount = typeof pgData === 'object' && 'monthly' in pgData ? pgData.monthly : 0;
  const details: string[] = [];
  
  details.push(`Pflegegeld PG ${careLevel}: ${baseAmount} €/Monat`);
  
  if (hasReliefBudget && careLevel >= 1) {
    details.push(`Entlastungsbetrag: ${PFLEGEGELD_2026.pg1.reliefBudget} €/Monat`);
  }
  
  if (hasCombinationBenefits && careLevel >= 2) {
    details.push(`Kombinationsleistungen: bis zu ${PFLEGEGELD_2026.entlastungsBudget} €/Jahr`);
  }
  
  const total = baseAmount + (hasReliefBudget ? PFLEGEGELD_2026.pg1.reliefBudget : 0);
  
  return { total, details };
}
