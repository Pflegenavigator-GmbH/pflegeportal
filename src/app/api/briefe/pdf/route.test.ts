// src/app/api/briefe/pdf/route.test.ts
import { NextRequest } from 'next/server';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { BriefGeneratorFactory } from '@/src/lib/briefe/generator-factory';
import { renderHtmlToPdf } from '@/src/lib/pdf/service';
import { createBriefPayloadMock } from '@/src/test-utils/factories/briefe';
import { BriefPayloadSchema } from '@/src/types/briefe-schema';

import { POST } from './route';

// Zentraler PDF-Service wird gemockt — die Puppeteer-Härtung ist dort getestet
vi.mock('@/src/lib/pdf/service', () => ({
  renderHtmlToPdf: vi.fn().mockResolvedValue(Buffer.from('%PDF-1.4 mock content')),
}));

vi.mock('@/src/lib/briefe/generator-factory', () => ({
  BriefGeneratorFactory: {
    getGenerator: vi.fn(),
  },
}));

vi.mock('@/src/types/briefe-schema', () => ({
  BriefPayloadSchema: {
    safeParse: vi.fn(),
  },
}));

describe('Briefe PDF Generator API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ENVIRONMENT = 'production';
  });

  it('sollte ein valides PDF generieren und als Stream mit passenden Headern ausgeben', async () => {
    const mockPayload = createBriefPayloadMock({ type: 'antrag-pflegegrad' });

    vi.mocked(BriefPayloadSchema.safeParse).mockReturnValue({ success: true, data: mockPayload });
    vi.mocked(BriefGeneratorFactory.getGenerator).mockReturnValue({
      generateBrief: vi.fn().mockReturnValue('Mein Brief-Inhalt für das PDF'),
    });

    const request = new NextRequest('http://localhost/api/briefe/pdf', {
      method: 'POST',
      body: JSON.stringify(mockPayload),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="Schreiben_antrag-pflegegrad.pdf"'
    );
    expect(renderHtmlToPdf).toHaveBeenCalledOnce();
  });

  it('sollte bei fatalen Render-Fehlern mit einem 500er reagieren', async () => {
    const mockPayload = createBriefPayloadMock({ type: 'allgemein' });
    vi.mocked(BriefPayloadSchema.safeParse).mockReturnValue({ success: true, data: mockPayload });
    vi.mocked(BriefGeneratorFactory.getGenerator).mockReturnValue({
      generateBrief: vi.fn().mockReturnValue('Inhalt'),
    });

    vi.mocked(renderHtmlToPdf).mockRejectedValueOnce(
      new Error('Chromium Process crashed unexpectedly')
    );

    const request = new NextRequest('http://localhost/api/briefe/pdf', {
      method: 'POST',
      body: JSON.stringify(mockPayload),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });

  it('sollte bei ungültigen Daten mit einem 400er antworten', async () => {
    vi.mocked(BriefPayloadSchema.safeParse).mockReturnValue({
      success: false,
      error: { issues: [] } as never,
    });

    const request = new NextRequest('http://localhost/api/briefe/pdf', {
      method: 'POST',
      body: JSON.stringify({ invalid: true }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
