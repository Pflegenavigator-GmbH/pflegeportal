import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { usePdfDownload } from './usePdfDownload';

// Mocke die Toasts und Logger
vi.mock('sonner', () => ({
  toast: { loading: vi.fn(), dismiss: vi.fn(), success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/src/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

describe('usePdfDownload Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="test-content">PDF Inhalt</div>';

    // Mocke URL.createObjectURL und revokeObjectURL
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:url'),
      revokeObjectURL: vi.fn(),
    });
  });

  it('sollte ein PDF herunterladen, wenn die API erfolgreich antwortet', async () => {
    // Mocke fetch für den Blob
    const blob = new Blob(['test-pdf-content'], { type: 'application/pdf' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => blob,
      })
    );

    // Mocke die Link-Funktionalität
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click');

    const { result } = renderHook(() =>
      usePdfDownload({
        caseCode: 'CASE123',
        elementId: 'test-content',
      })
    );

    await act(async () => {
      await result.current.downloadPdf();
    });

    expect(global.fetch).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });

  it('sollte showPaywall auf true setzen, wenn API 402 zurückgibt', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 402,
      })
    );

    const { result } = renderHook(() =>
      usePdfDownload({
        caseCode: 'CASE123',
        elementId: 'test-content',
      })
    );

    await act(async () => {
      await result.current.downloadPdf();
    });

    expect(result.current.showPaywall).toBe(true);
  });
});
