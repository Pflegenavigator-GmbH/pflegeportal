// src/lib/briefe/domains/schwerbehinderung/schwerbehinderung.generator.ts
import { BaseBriefGenerator } from '@/src/lib/briefe/base.generator';
import { generateSchwerbehindertenBriefTemplate } from '@/src/lib/briefe/domains/schwerbehinderung/schwerbehinderung.template';
import { logger } from '@/src/lib/logger';
import { BriefPayload } from '@/src/types/briefe';

export class SchwerbehindertenausweisGenerator extends BaseBriefGenerator {
  protected getTemplateParts(data: BriefPayload, heute: string): string[] {
    logger.info(
      { absender: data.absender.name, verfahrensart: data.verfahrensart },
      'Generiere Schwerbehindertenausweis-Antrag via DDD'
    );
    return generateSchwerbehindertenBriefTemplate(data, heute);
  }

  protected override postProcessParts(briefParts: string[], data: BriefPayload): void {
    briefParts.push('\nAnlagen:');
    briefParts.push('- Kopie Personalausweis');
    briefParts.push('- Liste der behandelnden Fachärzte und Kliniken');

    if (data.anlagen && data.anlagen.length > 0) {
      data.anlagen.forEach((anlage) => briefParts.push(`- ${anlage}`));
    }
  }
}

export const schwerbehindertenausweisGenerator = new SchwerbehindertenausweisGenerator();
