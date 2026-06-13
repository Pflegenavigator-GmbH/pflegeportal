import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { BriefPayload } from '../types/briefe';

import { useBriefGeneration } from './useBriefGeneration';

// Mocks für UI & Logger
vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn(() => 'toast-id'),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockPayload: BriefPayload = {
  type: 'schwerbehindertenausweis',
  betreff: 'Test Betreff',
  absender: { name: 'Max', strasse: 'Weg 1', plz: '12345', ort: 'Stadt' },
  empfaenger: { name: 'Amt', strasse: 'Platz 1', plz: '54321', ort: 'Stadt' },
  inhalt: { anrede: 'Hallo', hauptteil: 'Das ist ein valider Test-Hauptteil.' },
};

describe('useBriefGeneration Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // URL-API für den Blob-Download mocken
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:url-mock'),
      revokeObjectURL: vi.fn(),
    });
  });

  it('sollte die Text-Vorschau generieren und den State setzen', async () => {
    const mockServerResponse = { brief: 'Das ist der generierte Brieftext.' };

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockServerResponse,
    });
    vi.stubGlobal('fetch', fetchSpy);

    const { result } = renderHook(() => useBriefGeneration());

    await act(async () => {
      await result.current.generatePreview(mockPayload);
    });

    expect(fetchSpy).toHaveBeenCalledWith('/api/briefe/generate', expect.any(Object));
    expect(result.current.previewText).toBe(mockServerResponse.brief);
    expect(result.current.loading).toBe(false);
  });

  it('sollte den PDF-Download triggern und das DOM-Element klicken', async () => {
    const mockBlob = new Blob(['pdf-data'], { type: 'application/pdf' });

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => mockBlob,
    });
    vi.stubGlobal('fetch', fetchSpy);

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click');

    const { result } = renderHook(() => useBriefGeneration());

    await act(async () => {
      await result.current.downloadPdf(mockPayload);
    });

    expect(fetchSpy).toHaveBeenCalledWith('/api/briefe/pdf', expect.any(Object));
    expect(clickSpy).toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it('sollte Fehler abfangen und Loading zurücksetzen', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    const { result } = renderHook(() => useBriefGeneration());

    await act(async () => {
      await result.current.generatePreview(mockPayload);
    });

    expect(result.current.previewText).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
