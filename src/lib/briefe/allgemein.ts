// src/lib/briefe/allgemein.ts
import { generateAllgemeinBriefTemplate } from '@/src/lib/briefe/templates/allgemeinesTemplates';
import { logger } from '@/src/lib/logger';
import { BriefPayloadSchema } from '@/src/types/briefe-schema';

export class AllgemeinerBriefGenerator {
  generateBrief(payload: unknown): string {
    // 1. Validierung mit Zod
    const data = BriefPayloadSchema.parse(payload);

    logger.info({ empfaenger: data.empfaenger.name }, 'Generiere allgemeinen Behördenbrief');

    const heute = new Date().toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    // 2. Template laden
    const briefParts = generateAllgemeinBriefTemplate(data, heute);

    // 3. Anlagen hinzufügen
    if (data.anlagen && data.anlagen.length > 0) {
      briefParts.push('\nAnlagen:');
      data.anlagen.forEach((anlage) => briefParts.push(`- ${anlage}`));
    }

    // 4. Zusammenfügen
    return briefParts.filter(Boolean).join('\n');
  }
}

export const allgemeinerBriefGenerator = new AllgemeinerBriefGenerator();
