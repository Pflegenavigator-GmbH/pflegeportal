import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BaseBriefGenerator } from '@/src/lib/briefe/base.generator';
import { createBriefPayloadMock } from '@/src/test-utils/factories/briefe';
import { BriefPayload } from '@/src/types/briefe';

class TestGenerator extends BaseBriefGenerator {
  public readonly calls: string[] = [];

  protected getTemplateParts(): string[] {
    this.calls.push('getTemplateParts');

    return ['Zeile 1', '', 'Zeile 2'];
  }

  protected override postProcessParts(briefParts: string[]): void {
    this.calls.push('postProcessParts');

    briefParts.push('Post Processing');
  }
}

class DefaultPostProcessGenerator extends BaseBriefGenerator {
  protected getTemplateParts(): string[] {
    return ['Inhalt'];
  }
}

describe('BaseBriefGenerator', () => {
  beforeEach(() => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('generateBrief', () => {
    it('soll die zentrale Orchestrierung korrekt ausführen', () => {
      const generator = new TestGenerator();

      const result = generator.generateBrief(createBriefPayloadMock());

      expect(generator.calls).toEqual(['getTemplateParts', 'postProcessParts']);

      expect(result).toBe(['Zeile 1', 'Zeile 2', 'Post Processing'].join('\n'));
    });

    it('soll das aktuelle Datum im deutschen Format an getTemplateParts übergeben', () => {
      let receivedDate = '';

      class DateGenerator extends BaseBriefGenerator {
        protected getTemplateParts(_data: BriefPayload, heute: string): string[] {
          receivedDate = heute;
          return ['Inhalt'];
        }
      }

      new DateGenerator().generateBrief(createBriefPayloadMock());

      expect(receivedDate).toBe('15.01.2025');
    });

    it('soll leere Strings vor dem Join entfernen', () => {
      const generator = new TestGenerator();

      const result = generator.generateBrief(createBriefPayloadMock());

      expect(result).not.toContain('\n\n\n');
      expect(result).toContain('Zeile 1');
      expect(result).toContain('Zeile 2');
    });

    it('soll die Standard-Anlagen ergänzen', () => {
      const generator = new DefaultPostProcessGenerator();

      const result = generator.generateBrief(
        createBriefPayloadMock({
          anlagen: ['Anlage A', 'Anlage B'],
        })
      );

      expect(result).toContain('Anlagen:');
      expect(result).toContain('- Anlage A');
      expect(result).toContain('- Anlage B');
    });

    it('soll keine Anlagen-Sektion erzeugen wenn keine Anlagen vorhanden sind', () => {
      const generator = new DefaultPostProcessGenerator();

      const result = generator.generateBrief(
        createBriefPayloadMock({
          anlagen: undefined,
        })
      );

      expect(result).toBe('Inhalt');
    });

    it('soll einen Validierungsfehler weiterreichen', () => {
      const generator = new DefaultPostProcessGenerator();

      expect(() => generator.generateBrief({})).toThrow();
    });
  });
});
