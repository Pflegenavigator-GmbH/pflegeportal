import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EMRenteBriefGenerator } from '@/src/lib/briefe/domains/em-rente/em-rente.generator';
import { generateEMRenteTemplate } from '@/src/lib/briefe/domains/em-rente/em-rente.template';
import { logger } from '@/src/lib/logger';
import { createBriefPayloadMock } from '@/src/test-utils/factories/briefe';

vi.mock('@/src/lib/logger', () => ({
  logger: {
    info: vi.fn(),
  },
}));

vi.mock('@/src/lib/briefe/domains/em-rente/em-rente.template', () => ({
  generateEMRenteTemplate: vi.fn(),
}));

class TestEMRenteBriefGenerator extends EMRenteBriefGenerator {
  public exposeGetTemplateParts(
    data: Parameters<EMRenteBriefGenerator['getTemplateParts']>[0],
    heute: string
  ): string[] {
    return this.getTemplateParts(data, heute);
  }

  public exposePostProcessParts(
    briefParts: string[],
    data: Parameters<EMRenteBriefGenerator['postProcessParts']>[1]
  ): void {
    this.postProcessParts(briefParts, data);
  }
}

describe('EMRenteBriefGenerator', () => {
  const generator = new TestEMRenteBriefGenerator();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTemplateParts', () => {
    it('soll Logging durchführen und das Template erzeugen', () => {
      const payload = createBriefPayloadMock();
      const heute = '01.01.2025';

      const template = ['zeile-1', 'zeile-2'];

      vi.mocked(generateEMRenteTemplate).mockReturnValue(template);

      const result = generator.exposeGetTemplateParts(payload, heute);

      expect(logger.info).toHaveBeenCalledTimes(1);

      expect(logger.info).toHaveBeenCalledWith(
        {
          empfaenger: 'Zuständige Pflegekasse',
        },
        'Generiere EM-Rentenantrag via DDD'
      );

      expect(generateEMRenteTemplate).toHaveBeenCalledTimes(1);

      expect(generateEMRenteTemplate).toHaveBeenCalledWith(payload, heute);

      expect(result).toBe(template);
    });
  });

  describe('postProcessParts', () => {
    it('soll die Standard-Anlagen ergänzen', () => {
      const payload = createBriefPayloadMock();

      const briefParts: string[] = [];

      generator.exposePostProcessParts(briefParts, payload);

      expect(briefParts).toEqual([
        '\nAnlagen:',
        '- Personalausweis (Kopie)',
        '- Ärztliche Befunde / Entlassungsberichte der Kliniken',
      ]);
    });

    it('soll zusätzliche Anlagen ergänzen', () => {
      const payload = createBriefPayloadMock({
        anlagen: ['Gutachten', 'Medikamentenplan'],
      });

      const briefParts: string[] = [];

      generator.exposePostProcessParts(briefParts, payload);

      expect(briefParts).toEqual([
        '\nAnlagen:',
        '- Personalausweis (Kopie)',
        '- Ärztliche Befunde / Entlassungsberichte der Kliniken',
        '- Gutachten',
        '- Medikamentenplan',
      ]);
    });

    it('soll bei leerem Anlagen-Array nur Standard-Anlagen ergänzen', () => {
      const payload = createBriefPayloadMock({
        anlagen: [],
      });

      const briefParts: string[] = [];

      generator.exposePostProcessParts(briefParts, payload);

      expect(briefParts).toHaveLength(3);
    });

    it('soll bei undefined Anlagen nur Standard-Anlagen ergänzen', () => {
      const payload = createBriefPayloadMock({
        anlagen: undefined,
      });

      const briefParts: string[] = [];

      generator.exposePostProcessParts(briefParts, payload);

      expect(briefParts).toHaveLength(3);
    });

    it('soll leere Anlagen-Einträge unverändert übernehmen', () => {
      const payload = createBriefPayloadMock({
        anlagen: ['', 'Zusätzliche Anlage'],
      });

      const briefParts: string[] = [];

      generator.exposePostProcessParts(briefParts, payload);

      expect(briefParts).toContain('- ');
      expect(briefParts).toContain('- Zusätzliche Anlage');
    });
  });

  describe('generateGutachtenFragen', () => {
    it('soll die vollständige Fragenliste in der erwarteten Reihenfolge zurückgeben', () => {
      expect(generator.generateGutachtenFragen()).toEqual([
        'Welche Tätigkeiten können Sie noch ausführen?',
        'Welche Beschwerden haben Sie bei körperlicher Belastung?',
        'Wie lange können Sie konzentriert arbeiten?',
        'Gibt es Tageszeiten mit weniger Beschwerden?',
        'Benötigen Sie Pausen? Wie oft und wie lange?',
        'Können Sie sich ohne Hilfe fortbegewegen?',
        'Benötigen Sie Hilfe im Haushalt?',
      ]);
    });

    it('soll bei jedem Aufruf dieselbe Fragenliste liefern', () => {
      const firstResult = generator.generateGutachtenFragen();
      const secondResult = generator.generateGutachtenFragen();

      expect(firstResult).toEqual(secondResult);
      expect(firstResult).not.toBe(secondResult);
    });

    it('soll genau sieben Fragen enthalten', () => {
      expect(generator.generateGutachtenFragen()).toHaveLength(7);
    });
  });
});
