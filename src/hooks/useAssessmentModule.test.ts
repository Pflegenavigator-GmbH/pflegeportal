// src/hooks/useAssessmentModule.test.ts
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAssessmentModule } from '@/src/hooks/useAssessmentModule';
import { loadModuleAnswers, saveModuleAnswers } from '@/src/lib/pflegegrad/client-api';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ locale: 'de' }),
}));

vi.mock('@/src/lib/pflegegrad/client-api', async () => {
  const echt = await vi.importActual<typeof import('@/src/lib/pflegegrad/client-api')>(
    '@/src/lib/pflegegrad/client-api'
  );
  return { ...echt, loadModuleAnswers: vi.fn(), saveModuleAnswers: vi.fn() };
});

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn(), loading: vi.fn() },
}));

const FRAGEN = ['m1_1', 'm1_2', 'm1_3', 'm1_4'];

const rendereHook = () =>
  renderHook(() =>
    useAssessmentModule({
      moduleName: 'modul1',
      questionKeys: FRAGEN,
      next: (locale) => `/${locale}/pflegegrad/modul2`,
    })
  );

describe('useAssessmentModule — Speichern fremder Schlüssel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.setItem('case_code', 'PF-TEST-0001');
  });

  /**
   * Der Fall PF-C1HB-FH1I ließ sich nicht mehr speichern: Seine Modul-1-Zeile
   * enthielt seit dem 21.07.2026 zusätzlich die fünf Schlüssel aus Modul 6.
   * Die Seite lud sie mit und schickte sie zurück; die Prüfung im Server
   * antwortete mit 400 („Frageschlüssel ‚kochen' gehört nicht zu Modul 1"),
   * und zwar bei jedem Versuch.
   */
  it('sendet nur die Fragen des eigenen Moduls, auch wenn Fremdes geladen wurde', async () => {
    vi.mocked(loadModuleAnswers).mockResolvedValue({
      m1_1: '1',
      m1_2: '2',
      m1_3: '0',
      m1_4: '3',
      kochen: 'teilweise',
      haushalt: 'nicht',
    });
    vi.mocked(saveModuleAnswers).mockResolvedValue(undefined);

    const { result } = rendereHook();
    await waitFor(() => expect(result.current.antworten.m1_1).toBe('1'));

    await act(async () => {
      await result.current.speichernUndWeiter();
    });

    expect(saveModuleAnswers).toHaveBeenCalledWith('PF-TEST-0001', 'modul1', {
      m1_1: '1',
      m1_2: '2',
      m1_3: '0',
      m1_4: '3',
    });
    expect(mockPush).toHaveBeenCalledWith('/de/pflegegrad/modul2');
  });

  it('bleibt auf der Seite, wenn das Speichern fehlschlägt', async () => {
    vi.mocked(loadModuleAnswers).mockResolvedValue({ m1_1: '1' });
    vi.mocked(saveModuleAnswers).mockRejectedValue(new Error('400'));

    const { result } = rendereHook();
    await waitFor(() => expect(result.current.antworten.m1_1).toBe('1'));

    await act(async () => {
      await result.current.speichernUndWeiter();
    });

    // Eingaben dürfen nicht verloren gehen — kein Weiterblättern nach Fehler.
    expect(mockPush).not.toHaveBeenCalledWith('/de/pflegegrad/modul2');
    expect(result.current.antworten.m1_1).toBe('1');
  });
});
