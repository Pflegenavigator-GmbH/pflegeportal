// src/component/navigation/AppHeaderChrome.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { validateAndStoreSession } from '@/src/app/actions/case-session';
import AppHeaderChrome from '@/src/components/navigation/AppHeaderChrome';

// 1. Next.js Navigation Hooks mocken
const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
  usePathname: () => '/de/briefe', // Wir simulieren, dass wir nicht auf der Startseite sind
}));

// 2. Server Action mocken
vi.mock('@/src/app/actions/case-sessions', () => ({
  validateAndStoreSession: vi.fn(),
}));

describe('AppHeaderChrome Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
    // window.location.reload mocken, um unkontrollierte Page-Refreshes im Test zu verhindern
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: vi.fn() },
    });
  });

  it('sollte standardmäßig "Kein Fall" anzeigen, wenn kein LocalStorage gesetzt ist', () => {
    render(<AppHeaderChrome locale="de" />);

    expect(screen.getByText('Kein Fall')).toBeInTheDocument();
  });

  it('sollte den Fallcode aus dem LocalStorage direkt beim Laden anzeigen', () => {
    window.localStorage.setItem('case_code', 'PF-BETA-2026');
    render(<AppHeaderChrome locale="de" />);

    expect(screen.getByText('PF-BETA-2026')).toBeInTheDocument();
  });

  it('sollte bei erfolgreicher Server-Validierung den Code speichern und die Seite neu laden', async () => {
    // Server Action simuliert ein erfolgreiches Freischalten
    vi.mocked(validateAndStoreSession).mockResolvedValue({
      success: true,
      isUnlocked: true,
      isExpired: false,
      billingStatus: 'paid',
      caseCode: 'PF-VALID-1234',
    });

    render(<AppHeaderChrome locale="de" />);

    // Klick auf den Dropdown-Trigger, um das Eingabefeld zu öffnen
    const trigger = screen.getByText('Kein Fall');
    fireEvent.click(trigger);

    // Input-Feld befüllen
    const input = screen.getByPlaceholderText('PF-XXXX-XXXX');
    fireEvent.change(input, { target: { value: 'pf-valid-1234' } });

    // Absenden
    const submitButton = screen.getByRole('button', { name: /laden/i });
    fireEvent.click(submitButton);

    // Prüfen, ob Server Action mit korrigiertem UpperCase-Code aufgerufen wurde
    expect(validateAndStoreSession).toHaveBeenCalledWith('PF-VALID-1234');

    // Warten, bis der LocalStorage beschrieben und der Reload getriggert wurde
    await waitFor(() => {
      expect(window.localStorage.getItem('case_code')).toBe('PF-VALID-1234');
      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  it('sollte beim Schließen des Falls alle relevanten LocalStorage-Keys löschen', async () => {
    // Vorbereiten: Aktiven Fall simulieren
    window.localStorage.setItem('case_code', 'PF-DELETE-ME');
    window.localStorage.setItem('modul1_answers', 'some-data');

    // confirm()-Dialog des Browsers automatisch mit "JA" absegnen
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<AppHeaderChrome locale="de" />);

    // Dropdown öffnen (zeigt jetzt den aktiven Code an)
    const trigger = screen.getByText('PF-DELETE-ME');
    fireEvent.click(trigger);

    // Klick auf "Fall schließen"
    const closeButton = screen.getByText('Fall schließen');
    fireEvent.click(closeButton);

    // LocalStorage muss klinisch rein sein
    expect(window.localStorage.getItem('case_code')).toBeNull();
    expect(window.localStorage.getItem('modul1_answers')).toBeNull();

    // Router muss zurück auf den Start leiten
    expect(mockPush).toHaveBeenCalledWith('/de/pflegegrad/start');
  });
});
