// src/lib/briefe/base.generator.ts
import { BriefPayload } from '@/src/types/briefe';
import { BriefPayloadSchema } from '@/src/types/briefe-schema';

export interface IBriefGenerator {
  generateBrief(payload: unknown): string;
}

export abstract class BaseBriefGenerator implements IBriefGenerator {
  /**
   * Die Templating-Methode, die jede Domain individuell implementieren muss.
   */
  protected abstract getTemplateParts(data: BriefPayload, heute: string): string[];

  /**
   * Hook für optionale Modifikationen (z.B. spezifische Anlagen-Logik pro Domain)
   */
  protected postProcessParts(briefParts: string[], data: BriefPayload): void {
    if (data.anlagen && data.anlagen.length > 0) {
      briefParts.push('\nAnlagen:');
      data.anlagen.forEach((anlage) => briefParts.push(`- ${anlage}`));
    }
  }

  /**
   * Die zentrale, unveränderliche Orchestrierung (Template Method Pattern)
   */
  public generateBrief(payload: unknown): string {
    // 1. Zentrale Zod-Validierung für ALLE Generatoren
    const data = BriefPayloadSchema.parse(payload);

    const heute = new Date().toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    // 2. Domain-spezifisches Template laden
    const briefParts = this.getTemplateParts(data, heute);

    // 3. Post-Processing (Anlagen etc.)
    this.postProcessParts(briefParts, data);

    // 4. Zusammenfügen & Leerzeilen bereinigen
    return briefParts.filter(Boolean).join('\n');
  }
}
