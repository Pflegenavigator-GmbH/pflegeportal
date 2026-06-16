// src/lib/briefe/pflegegrad/pflegegrad.generator.ts
import { BaseBriefGenerator } from '@/src/lib/briefe/base.generator';
import { generatePflegegradTemplate } from '@/src/lib/briefe/domains/pflegegrad/pflegegrad.template';
import { logger } from '@/src/lib/logger';
import { BriefPayload } from '@/src/types/briefe';

export class AntragPflegegradGenerator extends BaseBriefGenerator {
  protected getTemplateParts(data: BriefPayload, heute: string): string[] {
    logger.info({ caseCode: data.betreff }, 'Generiere Pflegegrad-Brief via DDD-Template');
    return generatePflegegradTemplate(data, heute);
  }

  // Eigene Post-Process-Logik, weil die Pflegekasse Standard-Anlagen vorschreibt
  protected override postProcessParts(briefParts: string[], data: BriefPayload): void {
    briefParts.push('\nAnlagen:');
    briefParts.push('- Kopie des Personalausweises');
    briefParts.push('- Vorhandene ärztliche Befundberichte / Entlassungsbriefe');

    if (data.anlagen && data.anlagen.length > 0) {
      data.anlagen.forEach((anlage) => briefParts.push(`- ${anlage}`));
    }
  }
}

export const antragPflegegradGenerator = new AntragPflegegradGenerator();
