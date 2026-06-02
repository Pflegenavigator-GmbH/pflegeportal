// src/lib/pflegegrad/fragen.ts
import { Frage, BewertungOption } from '@/src/types/pflegegrad';

export const BEWERTUNGEN: BewertungOption[] = [
    { value: "0", label: "Keine Einschränkung", punkte: 0 },
    { value: "1", label: "Leichte Einschränkung", punkte: 1 },
    { value: "2", label: "Mittlere Einschränkung", punkte: 2 },
    { value: "3", label: "Schwere Einschränkung", punkte: 3 }
];

export const FRAGEN_MODUL_1: Frage[] = [
    { id: "m1_1", text: "Können Sie selbstständig aufstehen und sich fortbewegen?", hilfe: "Aufstehen aus dem Bett oder Stuhl und Bewegen innerhalb der Wohnung." },
    { id: "m1_2", text: "Benötigen Sie Hilfe beim Gehen oder Stehen?", hilfe: "Sicherheit beim Halten der Balance im Raum." },
    { id: "m1_3", text: "Können Sie Treppen steigen?", hilfe: "Überwinden von Stufen, ggf. mit Handlauf." },
    { id: "m1_4", text: "Sind Sie auf einen Rollstuhl angewiesen?", hilfe: "Nutzung zur Fortbewegung im Alltag." }
];