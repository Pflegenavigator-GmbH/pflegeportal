// src/app/api/briefe/pdf/route.test.ts
import { NextRequest } from 'next/server';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { BriefGeneratorFactory } from '@/src/lib/briefe/generator-factory';
import { createBriefPayloadMock } from '@/src/test-utils/factories/briefe';
import { BriefPayloadSchema } from '@/src/types/briefe-schema';

import { POST } from './route';

// 1. Alle Chaining-Mocks über vi.hoisted kapseln, damit sie VOR vi.mock existieren
const { mockPdfMethod, mockSetContentMethod, mockCloseMethod, mockNewPageMethod } = vi.hoisted(
  () => ({
    mockPdfMethod: vi.fn().mockResolvedValue(Buffer.from('%PDF-1.4 mock content')),
    mockSetContentMethod: vi.fn().mockResolvedValue(undefined),
    mockCloseMethod: vi.fn().mockResolvedValue(undefined),
    mockNewPageMethod: vi.fn(),
  })
);

// Dem verschachtelten Page-Mock die inneren Spies anhängen
mockNewPageMethod.mockResolvedValue({
  setContent: mockSetContentMethod,
  pdf: mockPdfMethod,
});

// 2. Puppeteer Kern-Modul sicher mit den gehoisteten Werten mocken
vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn().mockResolvedValue({
      newPage: mockNewPageMethod,
      close: mockCloseMethod,
    }),
  },
}));

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

describe('Briefe PDF Generator API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ENVIRONMENT = 'production';
  });

  it('sollte ein valides PDF generieren und als Stream mit passenden Headern ausgeben', async () => {
    const mockPayload = createBriefPayloadMock({ type: 'antrag-pflegegrad' });

    vi.mocked(BriefPayloadSchema.parse).mockReturnValue(mockPayload);
    vi.mocked(BriefGeneratorFactory.getGenerator).mockReturnValue({
      generateBrief: vi.fn().mockReturnValue('Mein Brief-Inhalt für das PDF'),
    });

    const request = new NextRequest('http://localhost/api/briefe/pdf', {
      method: 'POST',
      body: JSON.stringify(mockPayload),
    });

    const response = await POST(request);

    // Assertions für HTTP-Protokoll & DIN Stream-Header
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="Schreiben_antrag-pflegegrad.pdf"'
    );

    // Prüfen, ob Puppeteer ordnungsgemäß gestoppt wurde (Wichtig gegen Zombie-Prozesse)
    expect(mockCloseMethod).toHaveBeenCalled();
  });

  it('sollte bei fatalen Browser-Abstürzen mit einem 500er reagieren', async () => {
    const mockPayload = createBriefPayloadMock({ type: 'allgemein' });
    vi.mocked(BriefPayloadSchema.parse).mockReturnValue(mockPayload);
    vi.mocked(BriefGeneratorFactory.getGenerator).mockReturnValue({
      generateBrief: vi.fn().mockReturnValue('Inhalt'),
    });

    // Simuliere einen systemischen Puppeteer Crash während des Renderns
    mockPdfMethod.mockRejectedValueOnce(new Error('Chromium Process crashed unexpectedly'));

    const request = new NextRequest('http://localhost/api/briefe/pdf', {
      method: 'POST',
      body: JSON.stringify(mockPayload),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('PDF Generierung serverseitig abgebrochen');
    expect(mockCloseMethod).toHaveBeenCalled(); // Sicherstellen, dass die Instanz trotzdem geschlossen wird (try-catch-finally)
  });
});
