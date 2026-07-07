// src/app/api/briefe/route.test.ts
import { NextRequest } from 'next/server';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { BriefGeneratorFactory } from '@/src/lib/briefe/generator-factory';
import { createBriefPayloadMock } from '@/src/test-utils/factories/briefe';
import { BriefPayloadSchema } from '@/src/types/briefe-schema';

import { POST } from './route';

// Factory & Zod mocken
vi.mock('@/src/lib/briefe/generator-factory', () => ({
  BriefGeneratorFactory: {
    getGenerator: vi.fn(),
  },
}));

vi.mock('@/src/types/briefe-schema', () => ({
  BriefPayloadSchema: {
    parse: vi.fn(),
  },
}));

describe('Briefe Text API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sollte bei validen Daten Text generieren und 200 zurückgeben', async () => {
    // Nutzen der Factory für ein voll kompatibles Mock-Objekt
    const mockPayload = createBriefPayloadMock({ type: 'allgemein', betreff: 'Spezifischer Test' });
    const mockBriefText = 'Generierter Brief-Inhalt';

    vi.mocked(BriefPayloadSchema.parse).mockReturnValue(mockPayload);
    vi.mocked(BriefGeneratorFactory.getGenerator).mockReturnValue({
      generateBrief: vi.fn().mockReturnValue(mockBriefText),
    });

    const request = new NextRequest('http://localhost/api/briefe', {
      method: 'POST',
      body: JSON.stringify(mockPayload),
    });

    const response = await POST(request);
    const data = await response.json();

    // Korrigierte Assertions für den Erfolgsfall (200 statt 400!)
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.brief).toBe(mockBriefText);
    expect(data.meta.zeichenAnzahl).toBe(mockBriefText.length);
  });

  it('sollte bei Zod-Validierungsfehlern mit einem 400er antworten', async () => {
    const mockPayload = createBriefPayloadMock({ type: 'allgemein' });

    // Simuliere einen Zod-Parse-Fehler
    vi.mocked(BriefPayloadSchema.parse).mockImplementation(() => {
      throw new Error('Zod Validation Error');
    });

    const request = new NextRequest('http://localhost/api/briefe', {
      method: 'POST',
      body: JSON.stringify(mockPayload),
    });

    const response = await POST(request);
    const data = await response.json();

    // Assertions für den Fehlerfall
    expect(response.status).toBe(400);
    expect(data.error).toContain('Validierungsfehler: Bitte prüfen Sie Ihre Eingabedaten.');
  });
});
