// src/lib/briefe/domains/allgemein/allgemein.generator.ts
import { BaseBriefGenerator } from '@/src/lib/briefe';
import { generateAllgemeinBriefTemplate } from '@/src/lib/briefe/domains/allgemein/allgemein.template';
import { logger } from '@/src/lib/logger';
import { BriefPayload } from '@/src/types/briefe';

export class AllgemeinerBriefGenerator extends BaseBriefGenerator {
  protected getTemplateParts(data: BriefPayload, heute: string): string[] {
    logger.info(
      { empfaenger: data.empfaenger.name },
      'Generiere allgemeinen Behördenbrief via DDD'
    );
    return generateAllgemeinBriefTemplate(data, heute);
  }
}

export const allgemeinerBriefGenerator = new AllgemeinerBriefGenerator();
