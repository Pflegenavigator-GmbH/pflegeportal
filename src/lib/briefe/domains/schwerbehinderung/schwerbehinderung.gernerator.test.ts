import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SchwerbehindertenausweisGenerator } from '@/src/lib/briefe/domains/schwerbehinderung/schwerbehinderung.generator';
import { generateSchwerbehindertenBriefTemplate } from '@/src/lib/briefe/domains/schwerbehinderung/schwerbehinderung.template';
import { logger } from '@/src/lib/logger';
import { createBriefPayloadMock } from '@/src/test-utils/factories/briefe';

vi.mock('@/src/lib/logger', () => ({
  logger: {
    info: vi.fn(),
  },
}));

vi.mock('@/src/lib/briefe/domains/schwerbehinderung/schwerbehinderung.template', () => ({
  generateSchwerbehindertenBriefTemplate: vi.fn(),
}));

class TestSchwerbehindertenausweisGenerator extends SchwerbehindertenausweisGenerator {
  public exposeGetTemplateParts(
    data: Parameters<SchwerbehindertenausweisGenerator['getTemplateParts']>[0],
    heute: string
  ): string[] {
    return this.getTemplateParts(data, heute);
  }

  public exposePostProcessParts(
    briefParts: string[],
    data: Parameters<SchwerbehindertenausweisGenerator['postProcessParts']>[1]
  ): void {
    this.postProcessParts(briefParts, data);
  }
}

describe('SchwerbehindertenausweisGenerator', () => {
  const generator = new TestSchwerbehindertenausweisGenerator();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTemplateParts', () => {
    it('soll Logging durchführen und das Template erzeugen', () => {
      const payload = createBriefPayloadMock({
        verfahrensart: 'Neuantrag',
      });

      const heute = '01.01.2025';

      const template = ['zeile-1', 'zeile-2'];

      vi.mocked(generateSchwerbehindertenBriefTemplate).mockReturnValue(template);

      const result = generator.exposeGetTemplateParts(payload, heute);

      expect(logger.info).toHaveBeenCalledTimes(1);

      expect(logger.info).toHaveBeenCalledWith(
        {
          absender: 'Max Mustermann',
          verfahrensart: 'Neuantrag',
        },
        'Generiere Schwerbehindertenausweis-Antrag via DDD'
      );

      expect(generateSchwerbehindertenBriefTemplate).toHaveBeenCalledTimes(1);

      expect(generateSchwerbehindertenBriefTemplate).toHaveBeenCalledWith(payload, heute);

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
        '- Kopie Personalausweis',
        '- Liste der behandelnden Fachärzte und Kliniken',
      ]);
    });

    it('soll zusätzliche Anlagen ergänzen', () => {
      const payload = createBriefPayloadMock({
        anlagen: ['Befundbericht', 'Entlassungsbericht'],
      });

      const briefParts: string[] = [];

      generator.exposePostProcessParts(briefParts, payload);

      expect(briefParts).toEqual([
        '\nAnlagen:',
        '- Kopie Personalausweis',
        '- Liste der behandelnden Fachärzte und Kliniken',
        '- Befundbericht',
        '- Entlassungsbericht',
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

    it('soll bestehende Briefbestandteile beibehalten und erweitern', () => {
      const briefParts = ['Vorhandener Briefinhalt'];

      generator.exposePostProcessParts(briefParts, createBriefPayloadMock());

      expect(briefParts[0]).toBe('Vorhandener Briefinhalt');

      expect(briefParts.slice(1)).toEqual([
        '\nAnlagen:',
        '- Kopie Personalausweis',
        '- Liste der behandelnden Fachärzte und Kliniken',
      ]);
    });
  });
});
