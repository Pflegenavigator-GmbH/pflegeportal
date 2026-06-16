// src/lib/briefe/domains/em-rente/em-rente.generator.ts
import { BaseBriefGenerator } from '@/src/lib/briefe/base.generator';
import { generateEMRenteTemplate } from '@/src/lib/briefe/domains/em-rente/em-rente.template';
import { logger } from '@/src/lib/logger';
import { BriefPayload } from '@/src/types/briefe';

export class EMRenteBriefGenerator extends BaseBriefGenerator {
  protected getTemplateParts(data: BriefPayload, heute: string): string[] {
    logger.info({ empfaenger: data.empfaenger.name }, 'Generiere EM-Rentenantrag via DDD');
    return generateEMRenteTemplate(data, heute);
  }

  protected override postProcessParts(briefParts: string[], data: BriefPayload): void {
    briefParts.push('\nAnlagen:');
    briefParts.push('- Personalausweis (Kopie)');
    briefParts.push('- Ärztliche Befunde / Entlassungsberichte der Kliniken');

    if (data.anlagen && data.anlagen.length > 0) {
      data.anlagen.forEach((anlage) => briefParts.push(`- ${anlage}`));
    }
  }

  /**
   * Hilfsmethode zur Vorbereitung des medizinischen Gutachtens (MDK/Rententräger)
   */
  public generateGutachtenFragen(): string[] {
    return [
      'Welche Tätigkeiten können Sie noch ausführen?',
      'Welche Beschwerden haben Sie bei körperlicher Belastung?',
      'Wie lange können Sie konzentriert arbeiten?',
      'Gibt es Tageszeiten mit weniger Beschwerden?',
      'Benötigen Sie Pausen? Wie oft und wie lange?',
      'Können Sie sich ohne Hilfe fortbegewegen?',
      'Benötigen Sie Hilfe im Haushalt?',
    ];
  }
}

export const emRenteGenerator = new EMRenteBriefGenerator();
