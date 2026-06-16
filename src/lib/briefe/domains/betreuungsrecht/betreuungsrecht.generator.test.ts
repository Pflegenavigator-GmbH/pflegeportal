import { beforeEach, describe, expect, it, vi } from 'vitest';

import { betreuungsrechtGenerator } from '@/src/lib/briefe/domains/betreuungsrecht/betreuungsrecht.generator';
import { generateBetreuungsrechtTemplate } from '@/src/lib/briefe/domains/betreuungsrecht/betreuungsrecht.template';
import { logger } from '@/src/lib/logger';
import { createBriefPayloadMock } from '@/src/test-utils/factories/briefe';

vi.mock('@/src/lib/logger', () => ({
  logger: {
    info: vi.fn(),
  },
}));

vi.mock('@/src/lib/briefe/domains/betreuungsrecht/betreuungsrecht.template', () => ({
  generateBetreuungsrechtTemplate: vi.fn(),
}));

describe('BetreuungsrechtGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTemplateParts', () => {
    it('soll Logging durchführen und das Template erzeugen', () => {
      const payload = createBriefPayloadMock();
      const heute = '01.01.2025';

      const template = ['zeile-1', 'zeile-2'];

      vi.mocked(generateBetreuungsrechtTemplate).mockReturnValue(template);

      const result = (
        betreuungsrechtGenerator as unknown as {
          getTemplateParts: (data: typeof payload, heute: string) => string[];
        }
      ).getTemplateParts(payload, heute);

      expect(logger.info).toHaveBeenCalledTimes(1);

      expect(logger.info).toHaveBeenCalledWith(
        {
          empfaenger: 'Zuständige Pflegekasse',
        },
        'Generiere Schreiben zum Betreuungsrecht via DDD'
      );

      expect(generateBetreuungsrechtTemplate).toHaveBeenCalledTimes(1);

      expect(generateBetreuungsrechtTemplate).toHaveBeenCalledWith(payload, heute);

      expect(result).toBe(template);
    });
  });

  describe('postProcessParts', () => {
    it('soll die Standard-Anlagen ergänzen', () => {
      const payload = createBriefPayloadMock();

      const briefParts: string[] = [];

      (
        betreuungsrechtGenerator as unknown as {
          postProcessParts: (parts: string[], data: typeof payload) => void;
        }
      ).postProcessParts(briefParts, payload);

      expect(briefParts).toEqual([
        '\nAnlagen:',
        '1. Kopie des Personalausweises',
        '2. Ärztliche Atteste (bei Betreuungsantrag)',
        '3. Vorsorgevollmacht (beglaubigt, bei Vollmacht)',
      ]);
    });

    it('soll zusätzliche Anlagen fortlaufend nummerieren', () => {
      const payload = createBriefPayloadMock({
        anlagen: ['Gutachten', 'Vollmacht', 'Meldebescheinigung'],
      });

      const briefParts: string[] = [];

      (
        betreuungsrechtGenerator as unknown as {
          postProcessParts: (parts: string[], data: typeof payload) => void;
        }
      ).postProcessParts(briefParts, payload);

      expect(briefParts).toEqual([
        '\nAnlagen:',
        '1. Kopie des Personalausweises',
        '2. Ärztliche Atteste (bei Betreuungsantrag)',
        '3. Vorsorgevollmacht (beglaubigt, bei Vollmacht)',
        '4. Gutachten',
        '5. Vollmacht',
        '6. Meldebescheinigung',
      ]);
    });

    it('soll bei leerem Anlagen-Array nur die Standard-Anlagen ergänzen', () => {
      const payload = createBriefPayloadMock({
        anlagen: [],
      });

      const briefParts: string[] = [];

      (
        betreuungsrechtGenerator as unknown as {
          postProcessParts: (parts: string[], data: typeof payload) => void;
        }
      ).postProcessParts(briefParts, payload);

      expect(briefParts).toHaveLength(4);
    });

    it('soll bei undefined Anlagen nur die Standard-Anlagen ergänzen', () => {
      const payload = createBriefPayloadMock({
        anlagen: undefined,
      });

      const briefParts: string[] = [];

      (
        betreuungsrechtGenerator as unknown as {
          postProcessParts: (parts: string[], data: typeof payload) => void;
        }
      ).postProcessParts(briefParts, payload);

      expect(briefParts).toHaveLength(4);
    });

    it('soll leere Anlagen-Einträge unverändert übernehmen', () => {
      const payload = createBriefPayloadMock({
        anlagen: ['', 'Zusätzliche Anlage'],
      });

      const briefParts: string[] = [];

      (
        betreuungsrechtGenerator as unknown as {
          postProcessParts: (parts: string[], data: typeof payload) => void;
        }
      ).postProcessParts(briefParts, payload);

      expect(briefParts).toContain('4. ');
      expect(briefParts).toContain('5. Zusätzliche Anlage');
    });
  });
});
