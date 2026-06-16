import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ErbrechtGenerator } from '@/src/lib/briefe/domains/erbrecht/erbrecht.generator';
import { generateErbrechtTemplate } from '@/src/lib/briefe/domains/erbrecht/erbrecht.template';
import { logger } from '@/src/lib/logger';
import { createBriefPayloadMock } from '@/src/test-utils/factories/briefe';

vi.mock('@/src/lib/logger', () => ({
  logger: {
    info: vi.fn(),
  },
}));

vi.mock('@/src/lib/briefe/domains/erbrecht/erbrecht.template', () => ({
  generateErbrechtTemplate: vi.fn(),
}));

class TestErbrechtGenerator extends ErbrechtGenerator {
  public exposeGetTemplateParts(
    data: Parameters<ErbrechtGenerator['getTemplateParts']>[0],
    heute: string
  ): string[] {
    return this.getTemplateParts(data, heute);
  }

  public exposePostProcessParts(
    briefParts: string[],
    data: Parameters<ErbrechtGenerator['postProcessParts']>[1]
  ): void {
    this.postProcessParts(briefParts, data);
  }
}

describe('ErbrechtGenerator', () => {
  const generator = new TestErbrechtGenerator();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTemplateParts', () => {
    it('soll Logging durchführen und das Template erzeugen', () => {
      const payload = createBriefPayloadMock();
      const heute = '01.01.2025';

      const template = ['zeile-1', 'zeile-2'];

      vi.mocked(generateErbrechtTemplate).mockReturnValue(template);

      const result = generator.exposeGetTemplateParts(payload, heute);

      expect(logger.info).toHaveBeenCalledTimes(1);

      expect(logger.info).toHaveBeenCalledWith(
        {
          erblasser: 'Max Mustermann',
        },
        'Generiere Erbrecht-Schreiben via DDD'
      );

      expect(generateErbrechtTemplate).toHaveBeenCalledTimes(1);

      expect(generateErbrechtTemplate).toHaveBeenCalledWith(payload, heute);

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
        '1. Kopie des Personalausweises',
        '2. Familienstands- / Geburtsurkunden',
        '3. Vermögensnachweise bzw. Nachlassverzeichnis',
        '4. Sterbeurkunde (falls bereits vorhanden)',
      ]);
    });

    it('soll zusätzliche Anlagen fortlaufend nummerieren', () => {
      const payload = createBriefPayloadMock({
        anlagen: ['Testament', 'Grundbuchauszug', 'Kontoübersicht'],
      });

      const briefParts: string[] = [];

      generator.exposePostProcessParts(briefParts, payload);

      expect(briefParts).toEqual([
        '\nAnlagen:',
        '1. Kopie des Personalausweises',
        '2. Familienstands- / Geburtsurkunden',
        '3. Vermögensnachweise bzw. Nachlassverzeichnis',
        '4. Sterbeurkunde (falls bereits vorhanden)',
        '5. Testament',
        '6. Grundbuchauszug',
        '7. Kontoübersicht',
      ]);
    });

    it('soll bei leerem Anlagen-Array nur die Standard-Anlagen ergänzen', () => {
      const payload = createBriefPayloadMock({
        anlagen: [],
      });

      const briefParts: string[] = [];

      generator.exposePostProcessParts(briefParts, payload);

      expect(briefParts).toHaveLength(5);
    });

    it('soll bei undefined Anlagen nur die Standard-Anlagen ergänzen', () => {
      const payload = createBriefPayloadMock({
        anlagen: undefined,
      });

      const briefParts: string[] = [];

      generator.exposePostProcessParts(briefParts, payload);

      expect(briefParts).toHaveLength(5);
    });

    it('soll leere Anlagen-Einträge unverändert übernehmen', () => {
      const payload = createBriefPayloadMock({
        anlagen: ['', 'Zusätzliche Anlage'],
      });

      const briefParts: string[] = [];

      generator.exposePostProcessParts(briefParts, payload);

      expect(briefParts).toContain('5. ');
      expect(briefParts).toContain('6. Zusätzliche Anlage');
    });

    it('soll bestehende Briefbestandteile beibehalten und erweitern', () => {
      const payload = createBriefPayloadMock();

      const briefParts = ['Briefinhalt'];

      generator.exposePostProcessParts(briefParts, payload);

      expect(briefParts[0]).toBe('Briefinhalt');

      expect(briefParts.slice(1)).toEqual([
        '\nAnlagen:',
        '1. Kopie des Personalausweises',
        '2. Familienstands- / Geburtsurkunden',
        '3. Vermögensnachweise bzw. Nachlassverzeichnis',
        '4. Sterbeurkunde (falls bereits vorhanden)',
      ]);
    });
  });
});
