import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { usePflegekraefte } from './usePflegekraefte';

// Mocke die Tools-Daten, falls sie aus einem externen File kommen
vi.mock('@/src/data/pflegekraefte.tools', () => ({
  tools: [
    { id: '1', category: 'ai', name: 'KI-Assist' },
    { id: '2', category: 'ai', name: 'KI-Planer' },
    { id: '3', category: 'documentation', name: 'Bericht-Tool' },
  ],
}));

describe('usePflegekraefte Hook', () => {
  it('sollte Tools korrekt kategorisieren', () => {
    const { result } = renderHook(() => usePflegekraefte());

    expect(result.current.toolsByCategory.ai).toHaveLength(2);
    expect(result.current.toolsByCategory.documentation).toHaveLength(1);
  });

  it('sollte korrekte Metadaten für Kategorien zurückgeben', () => {
    const { result } = renderHook(() => usePflegekraefte());

    expect(result.current.categoryMeta.ai.label).toBe('KI-Tools');
    expect(result.current.categoryMeta.documentation.icon).toBeDefined();
  });

  it('sollte eine Scroll-Funktion bereitstellen', () => {
    // 1. Mock-Objekt mit der benötigten Methode definieren
    const elementMock = {
      scrollIntoView: vi.fn(),
    };

    // 2. Das any durch einen doppelten Cast ersetzen (unknown -> HTMLElement)
    vi.spyOn(document, 'getElementById').mockReturnValue(elementMock as unknown as HTMLElement);

    const { result } = renderHook(() => usePflegekraefte());

    result.current.scrollToSection('test-id');

    expect(document.getElementById).toHaveBeenCalledWith('test-id');
    expect(elementMock.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
  });
});
