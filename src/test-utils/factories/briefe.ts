// src/test-utils/factories/briefe.ts
import { BriefPayload } from '@/src/types/briefe';

/**
 * Erstellt ein vollständig valides BriefPayload-Objekt für Testzwecke.
 * Übergebene Felder überschreiben die Standardwerte (Partial-Pattern).
 */
export function createBriefPayloadMock(overrides?: Partial<BriefPayload>): BriefPayload {
  return {
    type: 'allgemein',
    betreff: 'Standard Test-Betreff',
    absender: {
      name: 'Max Mustermann',
      strasse: 'Musterstraße 1',
      plz: '12345',
      ort: 'Musterstadt',
      email: 'max@mustermann.de',
      telefon: '0123456789',
    },
    empfaenger: {
      name: 'Zuständige Pflegekasse',
      strasse: 'Kassenweg 42',
      plz: '54321',
      ort: 'Kassenstadt',
    },
    inhalt: {
      anrede: 'Sehr geehrte Damen und Herren,',
      hauptteil:
        'Dies ist ein gültiger Test-Hauptteil mit weit mehr als zehn Zeichen für die Validierung.',
    },
    ...overrides,
  };
}
