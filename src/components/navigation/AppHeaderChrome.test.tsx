// src/components/navigation/AppHeaderChrome.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { clearCaseSession, validateAndStoreSession } from '@/src/app/actions/case-session';
import AppHeaderChrome from '@/src/components/navigation/AppHeaderChrome';

import common from '../../../public/locales/de/common.json';

// 1. Next.js Navigation Hooks mocken
const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
  usePathname: () => '/de/briefe', // Wir simulieren, dass wir nicht auf der Startseite sind
  // `useParams` braucht das per next/dynamic nachgeladene AccessShareModal.
  // Es taucht erst auf, sobald ein Fallcode gesetzt ist und der Ladevorgang
  // durch ist — deshalb schlug es nur im letzten Test zu.
  useParams: () => ({ locale: 'de' }),
  useSearchParams: () => new URLSearchParams(),
}));

// 2. Server Actions mocken.
//    ACHTUNG: Der Pfad muss exakt dem Import in der Komponente entsprechen
//    (case-session, NICHT case-sessions). Ein Tippfehler hier schlägt nicht
//    fehl — vi.mock legt still eine Attrappe für ein Modul an, das niemand
//    importiert, und die Komponente ruft weiter die echte Server Action auf.
vi.mock('@/src/app/actions/case-session', () => ({
  validateAndStoreSession: vi.fn(),
  clearCaseSession: vi.fn(),
}));

// 3. Toasts brauchen im Test keinen Renderer.
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn(), loading: vi.fn() },
}));

/**
 * Der Header enthält den LanguageSwitcher, und der ruft `useLocale()` auf —
 * ohne Provider wirft next-intl beim Rendern.
 *
 * Die echten deutschen Nachrichten statt eines leeren Objekts: Seit der Header
 * seine Beschriftungen selbst übersetzt, rendert `messages={{}}` nur noch
 * Schlüsselpfade wie `common.header.fall.keiner`, und jede Zusicherung auf
 * sichtbaren Text schlägt fehl. Mit den echten Nachrichten prüft der Test
 * zugleich, dass die Schlüssel überhaupt existieren.
 */
const rendereHeader = () =>
  render(
    <NextIntlClientProvider locale="de" messages={{ common }}>
      <AppHeaderChrome locale="de" />
    </NextIntlClientProvider>
  );

/** Vollständige Antwort der Server Action, damit die Typen stimmen. */
const sitzung = (
  ueberschreibung: Partial<Awaited<ReturnType<typeof validateAndStoreSession>>>
) => ({
  success: true,
  isUnlocked: true,
  isExpired: false,
  billingStatus: 'paid',
  caseCode: null,
  ...ueberschreibung,
});

describe('AppHeaderChrome Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();

    // Navigation im Test unterbinden. `assign` gehört dazu — der Fall-Reset
    // nutzt window.location.assign, nicht den Router.
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        reload: vi.fn(),
        assign: vi.fn(),
        replace: vi.fn(),
        href: 'http://localhost/de/briefe',
        origin: 'http://localhost',
      },
    });
  });

  it('sollte standardmäßig "Kein Fall" anzeigen, wenn kein LocalStorage gesetzt ist', () => {
    rendereHeader();

    expect(screen.getByText('Kein Fall')).toBeInTheDocument();
  });

  it('sollte den Fallcode aus dem LocalStorage direkt beim Laden anzeigen', () => {
    window.localStorage.setItem('case_code', 'PF-BETA-2026');
    rendereHeader();

    expect(screen.getByText('PF-BETA-2026')).toBeInTheDocument();
  });

  it('sollte bei erfolgreicher Server-Validierung den Code speichern und die Seite neu laden', async () => {
    vi.mocked(validateAndStoreSession).mockResolvedValue(sitzung({ caseCode: 'PF-VALID-1234' }));

    rendereHeader();

    // Klick auf den Dropdown-Trigger, um das Eingabefeld zu öffnen
    fireEvent.click(screen.getByText('Kein Fall'));

    // Input-Feld befüllen — die Komponente normalisiert auf Großschreibung
    fireEvent.change(screen.getByPlaceholderText('PF-XXXX-XXXX'), {
      target: { value: 'pf-valid-1234' },
    });

    fireEvent.click(screen.getByRole('button', { name: /akte öffnen/i }));

    expect(validateAndStoreSession).toHaveBeenCalledWith('PF-VALID-1234');

    await waitFor(() => {
      expect(window.localStorage.getItem('case_code')).toBe('PF-VALID-1234');
      // Hard-Reload, damit Server Components das neue Cookie sehen.
      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  it('sollte einen abgelaufenen Beta-Zugang nicht als Fall übernehmen', async () => {
    vi.mocked(validateAndStoreSession).mockResolvedValue(
      sitzung({ isUnlocked: false, isExpired: true, billingStatus: 'expired' })
    );

    rendereHeader();
    fireEvent.click(screen.getByText('Kein Fall'));
    fireEvent.change(screen.getByPlaceholderText('PF-XXXX-XXXX'), {
      target: { value: 'PF-ALT-0001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /akte öffnen/i }));

    await waitFor(() => expect(validateAndStoreSession).toHaveBeenCalled());

    // Der Fall darf weder gespeichert noch die Seite neu geladen werden.
    expect(window.localStorage.getItem('case_code')).toBeNull();
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  it('sollte beim Schließen des Falls die Session serverseitig entwerten und lokal aufräumen', async () => {
    window.localStorage.setItem('case_code', 'PF-DELETE-ME');
    // Gesundheitsbezogene Reste, die ein bewusstes Schließen nicht überleben
    // dürfen — auf einem geteilten Rechner läge sonst der Pflegegrad offen.
    window.localStorage.setItem('pflegegrad-ergebnis', '{"grad":3}');
    window.localStorage.setItem('widersprueche_pipeline', '[{"id":1}]');
    // Geräteeinstellung: muss bleiben.
    window.localStorage.setItem('pf-a11y', '{"contrast":"high"}');

    // confirm()-Dialog des Browsers automatisch mit "JA" absegnen
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    rendereHeader();

    fireEvent.click(screen.getByText('PF-DELETE-ME'));
    fireEvent.click(screen.getByText('Fall schließen'));

    await waitFor(() => {
      // Das HTTP-only-Cookie kann nur der Server entwerten — ein reines
      // Aufräumen im localStorage würde die Sitzung offen lassen.
      expect(clearCaseSession).toHaveBeenCalled();
      expect(window.localStorage.getItem('case_code')).toBeNull();
      expect(window.localStorage.getItem('pflegegrad-ergebnis')).toBeNull();
      expect(window.localStorage.getItem('widersprueche_pipeline')).toBeNull();
      expect(window.localStorage.getItem('pf-a11y')).toBe('{"contrast":"high"}');
      // Voller Seitenwechsel statt router.push, damit kein Server-State
      // des alten Falls im Speicher bleibt.
      expect(window.location.assign).toHaveBeenCalledWith('/de/pflegegrad/start');
    });
  });

  it('sollte den Fall behalten, wenn der Bestätigungsdialog abgelehnt wird', () => {
    window.localStorage.setItem('case_code', 'PF-KEEP-ME');
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    rendereHeader();

    fireEvent.click(screen.getByText('PF-KEEP-ME'));
    fireEvent.click(screen.getByText('Fall schließen'));

    expect(clearCaseSession).not.toHaveBeenCalled();
    expect(window.localStorage.getItem('case_code')).toBe('PF-KEEP-ME');
  });
});
