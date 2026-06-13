import { generateSchwerbehindertenBriefTemplate } from '@/src/lib/briefe/templates/templatesSchwerbehinderten';
import { logger } from '@/src/lib/logger';
import { BriefPayloadSchema } from '@/src/types/briefe-schema';

export class SchwerbehindertenausweisGenerator {
  /**
   * Generiert einen Antrag auf Feststellung des Grades der Behinderung (GdB).
   * @param payload - Die Rohdaten aus dem Formular (wird durch Zod validiert)
   */
  generateBrief(payload: unknown): string {
    const data = BriefPayloadSchema.parse(payload); // Jetzt ist 'data' BriefPayload (aus Zod)

    // Jetzt kennt TypeScript 'data.verfahrensart', da es im Schema steht
    logger.info(
      { absender: data.absender.name, verfahrensart: data.verfahrensart },
      'Generiere Schwerbehindertenausweis-Antrag'
    );

    const heute = new Date().toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    // 2. Template laden
    const briefParts = generateSchwerbehindertenBriefTemplate(data, heute);

    // 3. Anlagen hinzufügen
    if (data.anlagen && data.anlagen.length > 0) {
      data.anlagen.forEach((anlage) => briefParts.push(`- ${anlage}`));
    }

    logger.debug('Schwerbehindertenausweis-Antrag erfolgreich generiert');

    // 4. Zusammenfügen
    return briefParts.filter(Boolean).join('\n');
  }
}

export const schwerbehindertenausweisGenerator = new SchwerbehindertenausweisGenerator();
