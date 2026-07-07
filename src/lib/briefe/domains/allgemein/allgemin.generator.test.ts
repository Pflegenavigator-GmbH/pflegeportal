import { describe, expect, it, vi, beforeEach } from 'vitest';

import { allgemeinerBriefGenerator } from '@/src/lib/briefe/domains/allgemein/allgemein.generator';
import { generateAllgemeinBriefTemplate } from '@/src/lib/briefe/domains/allgemein/allgemein.template';
import { logger } from '@/src/lib/logger';
import { createBriefPayloadMock } from '@/src/test-utils/factories/briefe';

vi.mock('@/src/lib/logger', () => ({
  logger: {
    info: vi.fn(),
  },
}));

vi.mock('@/src/lib/briefe/domains/allgemein/allgemein.template', () => ({
  generateAllgemeinBriefTemplate: vi.fn(),
}));

describe('AllgemeinerBriefGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('soll Logging durchführen und das Template erzeugen', () => {
    const payload = createBriefPayloadMock();
    const heute = '01.01.2025';

    const template = ['zeile-1', 'zeile-2'];

    vi.mocked(generateAllgemeinBriefTemplate).mockReturnValue(template);

    const result = (
      allgemeinerBriefGenerator as unknown as {
        getTemplateParts: (data: typeof payload, heute: string) => string[];
      }
    ).getTemplateParts(payload, heute);

    expect(logger.info).toHaveBeenCalledTimes(1);

    expect(logger.info).toHaveBeenCalledWith(
      {
        empfaenger: 'Zuständige Pflegekasse',
      },
      'Generiere allgemeinen Behördenbrief via DDD'
    );

    expect(generateAllgemeinBriefTemplate).toHaveBeenCalledTimes(1);

    expect(generateAllgemeinBriefTemplate).toHaveBeenCalledWith(payload, heute);

    expect(result).toBe(template);
  });
});
