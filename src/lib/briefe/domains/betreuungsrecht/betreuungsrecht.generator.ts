// src/lib/briefe/domains/betreuungsrecht/betreuungsrecht.generator.ts
import { BaseBriefGenerator } from '@/src/lib/briefe/base.generator';
import { generateBetreuungsrechtTemplate } from '@/src/lib/briefe/domains/betreuungsrecht/betreuungsrecht.template';
import { logger } from '@/src/lib/logger';
import { BriefPayload } from '@/src/types/briefe';

export class BetreuungsrechtGenerator extends BaseBriefGenerator {
  protected getTemplateParts(data: BriefPayload, heute: string): string[] {
    logger.info(
      { empfaenger: data.empfaenger.name },
      'Generiere Schreiben zum Betreuungsrecht via DDD'
    );
    return generateBetreuungsrechtTemplate(data, heute);
  }

  protected override postProcessParts(briefParts: string[], data: BriefPayload): void {
    briefParts.push('\nAnlagen:');
    briefParts.push('1. Kopie des Personalausweises');
    briefParts.push('2. Ärztliche Atteste (bei Betreuungsantrag)');
    briefParts.push('3. Vorsorgevollmacht (beglaubigt, bei Vollmacht)');

    if (data.anlagen && data.anlagen.length > 0) {
      data.anlagen.forEach((anlage, index) => {
        briefParts.push(`${index + 4}. ${anlage}`);
      });
    }
  }
}

export const betreuungsrechtGenerator = new BetreuungsrechtGenerator();
