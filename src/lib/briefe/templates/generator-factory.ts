// src/lib/breife/templates/generator-factory.ts
import { allgemeinerBriefGenerator, schwerbehindertenausweisGenerator } from '@/src/lib/briefe';
import { BriefPayload } from '@/src/types/briefe';

// Interface für alle Generatoren (damit die Factory konsistent bleibt)
export interface IBriefGenerator {
  generateBrief(payload: unknown): string;
}

export class BriefGeneratorFactory {
  static getGenerator(type: BriefPayload['type']): IBriefGenerator {
    switch (type) {
      case 'schwerbehindertenausweis':
        return schwerbehindertenausweisGenerator;
      case 'allgemein':
        return allgemeinerBriefGenerator;
      default:
        return allgemeinerBriefGenerator;
    }
  }
}
