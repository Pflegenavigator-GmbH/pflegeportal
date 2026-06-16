import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AntragPflegegradGenerator } from '@/src/lib/briefe/domains/pflegegrad/pflegegrad.generator';
import { generatePflegegradTemplate } from '@/src/lib/briefe/domains/pflegegrad/pflegegrad.template';
import { logger } from '@/src/lib/logger';
import { createBriefPayloadMock } from '@/src/test-utils/factories/briefe';

vi.mock('@/src/lib/logger', () => ({
  logger: {
    info: vi.fn(),
  },
}));

vi.mock('@/src/lib/briefe/domains/pflegegrad/pflegegrad.template', () => ({
  generatePflegegradTemplate: vi.fn(),
}));

class TestAntragPflegegradGenerator extends AntragPflegegradGenerator {
  public exposeGetTemplateParts(
    data: Parameters<AntragPflegegradGenerator['getTemplateParts']>[0],
    heute: string
  ): string[] {
    return this.getTemplateParts(data, heute);
  }

  public exposePostProcessParts(
    briefParts: string[],
    data: Parameters<AntragPflegegradGenerator['postProcessParts']>[1]
  ): void {
    this.postProcessParts(briefParts, data);
  }
}

describe('AntragPflegegradGenerator', () => {
  const generator = new TestAntragPflegegradGenerator();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTemplateParts', () => {
    it('soll Logging durchführen und das Pflegegrad-Template erzeugen', () => {
      const payload = createBriefPayloadMock({
        betreff: 'Pflegegrad-Erstantrag',
      });

      const heute = '01.01.2025';

      const template = ['zeile-1', 'zeile-2'];

      vi.mocked(generatePflegegradTemplate).mockReturnValue(template);

      const result = generator.exposeGetTemplateParts(payload, heute);

      expect(logger.info).toHaveBeenCalledTimes(1);

      expect(logger.info).toHaveBeenCalledWith(
        {
          caseCode: 'Pflegegrad-Erstantrag',
        },
        'Generiere Pflegegrad-Brief via DDD-Template'
      );

      expect(generatePflegegradTemplate).toHaveBeenCalledTimes(1);

      expect(generatePflegegradTemplate).toHaveBeenCalledWith(payload, heute);

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
        '- Kopie des Personalausweises',
        '- Vorhandene ärztliche Befundberichte / Entlassungsbriefe',
      ]);
    });

    it('soll zusätzliche Anlagen ergänzen', () => {
      const payload = createBriefPayloadMock({
        anlagen: ['Pflegegutachten', 'Medikamentenplan'],
      });

      const briefParts: string[] = [];

      generator.exposePostProcessParts(briefParts, payload);

      expect(briefParts).toEqual([
        '\nAnlagen:',
        '- Kopie des Personalausweises',
        '- Vorhandene ärztliche Befundberichte / Entlassungsbriefe',
        '- Pflegegutachten',
        '- Medikamentenplan',
      ]);
    });

    it('soll bei leerem Anlagen-Array nur die Standard-Anlagen ergänzen', () => {
      const payload = createBriefPayloadMock({
        anlagen: [],
      });

      const briefParts: string[] = [];

      generator.exposePostProcessParts(briefParts, payload);

      expect(briefParts).toHaveLength(3);
    });

    it('soll bei undefined Anlagen nur die Standard-Anlagen ergänzen', () => {
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

    it('soll bestehende Briefteile beibehalten und erweitern', () => {
      const payload = createBriefPayloadMock();

      const briefParts = ['Bereits vorhandener Inhalt'];

      generator.exposePostProcessParts(briefParts, payload);

      expect(briefParts[0]).toBe('Bereits vorhandener Inhalt');

      expect(briefParts.slice(1)).toEqual([
        '\nAnlagen:',
        '- Kopie des Personalausweises',
        '- Vorhandene ärztliche Befundberichte / Entlassungsbriefe',
      ]);
    });
  });
});
