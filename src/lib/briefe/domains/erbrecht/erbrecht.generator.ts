// src/lib/briefe/domains/erbrecht/erbrecht.generator.ts
import { BaseBriefGenerator } from '@/src/lib/briefe/base.generator';
import { generateErbrechtTemplate } from '@/src/lib/briefe/domains/erbrecht/erbrecht.template';
import { logger } from '@/src/lib/logger';
import { BriefPayload } from '@/src/types/briefe';

export class ErbrechtGenerator extends BaseBriefGenerator {
  protected getTemplateParts(data: BriefPayload, heute: string): string[] {
    logger.info({ erblasser: data.absender.name }, 'Generiere Erbrecht-Schreiben via DDD');
    return generateErbrechtTemplate(data, heute);
  }

  protected override postProcessParts(briefParts: string[], data: BriefPayload): void {
    briefParts.push('\nAnlagen:');
    briefParts.push('1. Kopie des Personalausweises');
    briefParts.push('2. Familienstands- / Geburtsurkunden');
    briefParts.push('3. Vermögensnachweise bzw. Nachlassverzeichnis');
    briefParts.push('4. Sterbeurkunde (falls bereits vorhanden)');

    if (data.anlagen && data.anlagen.length > 0) {
      data.anlagen.forEach((anlage, index) => {
        briefParts.push(`${index + 5}. ${anlage}`);
      });
    }
  }
}

export const erbrechtGenerator = new ErbrechtGenerator();
