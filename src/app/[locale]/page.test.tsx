// src/app/[locale]/page.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import Startseite from '@/src/app/[locale]/page';
import { createMockCase } from '@/test-utils/factories/cases';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ locale: 'de' }),
}));

describe('Startseite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Sauberes Überschreiben des window-localStorage
    Object.defineProperty(window, 'localStorage', {
      value: { getItem: vi.fn(), setItem: vi.fn(), clear: vi.fn() },
      writable: true,
    });
  });

  it('sollte den Button-Text nach Hydration anpassen, wenn Session aktiv ist', async () => {
    const mockCase = createMockCase();
    vi.mocked(window.localStorage.getItem).mockReturnValue(mockCase.case_code);

    render(<Startseite />);

    // findByText wartet automatisch, bis der useEffect den Text im DOM ändert
    const titleElement = await screen.findByText(/Analyse ansehen/i);
    expect(titleElement).toBeInTheDocument();

    const button = screen.getByRole('button', { name: /Zur Analyse/i });
    expect(button).toBeInTheDocument();
  });
});
