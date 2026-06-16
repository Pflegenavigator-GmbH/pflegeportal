// src/types/briefe-schema.ts
import { z } from 'zod';

export const BriefAdresseSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  vorname: z.string().optional(),
  // Für den Absender/Versicherten erzwingen wir diese im Frontend-Formular,
  // aber das Schema lassen wir flexibel, damit die Kassen-Adressen leer sein dürfen:
  strasse: z.string().default(''),
  plz: z.string().default(''),
  ort: z.string().default(''),
  telefon: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')), // Erlaubt auch leere Strings
  sozialversicherungsnummer: z.string().optional(),
  versichertennummer: z.string().optional(),
  geburtsdatum: z.string().optional(),
});

export const BriefPayloadSchema = z.object({
  type: z.enum([
    'antrag-pflegegrad',
    'widerspruch-pflegegrad',
    'versorgungsamt',
    'em-rente',
    'schwerbehindertenausweis',
    'betreuungsrecht',
    'erbrecht',
    'allgemein',
  ]),
  absender: BriefAdresseSchema,
  empfaenger: BriefAdresseSchema,
  betreff: z.string().min(1),
  inhalt: z.object({
    anrede: z.string().min(1),
    hauptteil: z.string().min(10),
  }),
  anlagen: z.array(z.string()).optional(),
  verfahrensart: z.string().optional(),
  aktenzeichen: z.string().optional(),
});

export type BriefPayload = z.infer<typeof BriefPayloadSchema>;
