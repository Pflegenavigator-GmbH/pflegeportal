// src/types/briefe.ts
export type BriefType =
    | 'antrag-pflegegrad'
    | 'widerspruch-pflegegrad'
    | 'versorgungsamt'
    | 'em-rente'
    | 'schwerbehindertenausweis'
    | 'betreuungsrecht'
    | 'erbrecht'
    | 'allgemein';

export interface BriefAdresse {
    name: string;
    vorname?: string;
    strasse: string;
    plz: string;
    ort: string;
    telefon?: string;
    email?: string;
    geburtsdatum?: string;
    versichertennummer?: string;
    sozialversicherungsnummer?: string;
}

export interface BriefInhalt {
    betreff: string;
    anrede: string;
    einleitung?: string;
    hauptteil: string;
    schluss?: string;
}

export interface BriefPayload {
    type: BriefType;
    absender: BriefAdresse;
    empfaenger: BriefAdresse;
    betreff: string;
    inhalt: BriefInhalt;
    anlagen?: string[];
    aktenzeichen?: string;
    verfahrensart?: string;
}