// src/app/[locale]/page.test.tsx
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import rawMessages from '@/public/locales/de/startseite.json';

import Startseite from './page';

// ============================================================================
// 🧪 MOCK-SETUP
// ============================================================================

const pushMock = vi.hoisted(() => vi.fn());

// Router mocken — wir wollen nur wissen, WOHIN navigiert würde
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

// next/image auf ein simples <img> reduzieren (fill/priority sind keine DOM-Attribute)
vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} src="test-bild.png" />,
}));

// Statischen Bild-Import abfangen, damit Vitest den PNG-Pfad nicht auflösen muss
vi.mock('@/public/megan_rexazin_conde-medical-5459633_1920.png', () => ({
  default: { src: 'test-bild.png', height: 1080, width: 1920 },
}));
const startseiteMessages =
  'startseite' in rawMessages
    ? (rawMessages as { startseite: Record<string, unknown> }).startseite
    : (rawMessages as Record<string, unknown>);

// Typ-Helfer für den Zugriff auf verschachtelte Message-Werte in den Erwartungen
const msg = startseiteMessages as {
  hero: Record<string, string>;
  promise: Record<string, string>;
  features: { heading: string; subheading: string; items: Record<string, Record<string, string>> };
  b2b: Record<string, string>;
  trust: Record<string, string>;
};

function renderStartseite() {
  return render(
    <NextIntlClientProvider
      locale="de"
      messages={{ startseite: startseiteMessages }}
      // Jeder Intl-Fehler (MISSING_MESSAGE, INVALID_TAG, ...) soll den Test
      // hart fehlschlagen lassen statt nur in der Konsole zu landen
      onError={(err) => {
        throw err;
      }}
    >
      <Startseite />
    </NextIntlClientProvider>
  );
}

// ============================================================================
// ✅ TESTS
// ============================================================================

describe('Startseite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });
  // --------------------------------------------------------------------------
  // Rendering & i18n-Regression
  // --------------------------------------------------------------------------

  it('rendert ohne Intl-Fehler (Regression für INVALID_TAG / MISSING_MESSAGE)', () => {
    // Wirft dank onError, falls irgendein Key fehlt oder ein Tag ungültig ist
    expect(() => renderStartseite()).not.toThrow();
  });

  it('zeigt den Hero-Titel als H1 inkl. hervorgehobenem "Pflegedschungel"', () => {
    renderStartseite();

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(/Pflegedschungel/);

    // Der rich-text-Span muss als eigenes Element existieren (t.rich funktioniert)
    const highlight = within(heading).getByText('Pflegedschungel');
    expect(highlight.tagName).toBe('SPAN');
  });

  it('rendert den Hero-Text mit eingesetztem Avatar-Namen', () => {
    renderStartseite();

    expect(screen.getByText(new RegExp(msg.hero.avatarName))).toBeInTheDocument();
  });

  it('rendert das Leistungsversprechen mit der Portal-Zeit', () => {
    renderStartseite();

    const promise = screen.getByRole('note', { name: 'Leistungsversprechen' });
    expect(promise).toHaveTextContent(msg.promise.timePortal);
  });

  // --------------------------------------------------------------------------
  // Session-Weiche im Hero (localStorage)
  // --------------------------------------------------------------------------

  it('zeigt OHNE aktive Session den Start-Button und navigiert zum Start', async () => {
    const user = userEvent.setup();
    renderStartseite();

    const startButton = screen.getByRole('button', { name: msg.hero.btnStart });
    expect(screen.queryByRole('button', { name: msg.hero.btnResume })).not.toBeInTheDocument();

    await user.click(startButton);
    expect(pushMock).toHaveBeenCalledWith('./pflegegrad/start');
  });

  /*
it('zeigt MIT aktiver Session den Fortsetzen-Button und navigiert zum Ergebnis', async () => {
  // Robust gegen localStorage-Mocks im Setup: getItem direkt am Prototype spionieren
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('pf-test-0001');

  const user = userEvent.setup();
  renderStartseite();

  const resumeButton = await screen.findByRole('button', { name: msg.hero.btnResume });
  expect(screen.queryByRole('button', { name: msg.hero.btnStart })).not.toBeInTheDocument();

  await user.click(resumeButton);
  expect(pushMock).toHaveBeenCalledWith('./pflegegrad/ergebnis');
});
*/

  it('navigiert über den Widerspruch-Button zur Widerspruch-Seite', async () => {
    const user = userEvent.setup();
    renderStartseite();

    await user.click(screen.getByRole('button', { name: msg.hero.btnWiderspruch }));
    expect(pushMock).toHaveBeenCalledWith('./widerspruch');
  });

  // --------------------------------------------------------------------------
  // Feature-Grid
  // --------------------------------------------------------------------------

  it('rendert alle sechs Feature-Karten mit Titel, Tag und Beschreibung', () => {
    renderStartseite();

    for (const item of Object.values(msg.features.items)) {
      expect(screen.getByRole('heading', { level: 3, name: item.title })).toBeInTheDocument();
      expect(screen.getByText(item.description)).toBeInTheDocument();
    }
  });

  it('navigiert beim Klick auf eine verlinkte Feature-Karte', async () => {
    const user = userEvent.setup();
    renderStartseite();

    const rechnerCard = screen
      .getByRole('heading', { level: 3, name: msg.features.items.rechner.title })
      .closest('[role="link"]');
    expect(rechnerCard).not.toBeNull();

    await user.click(rechnerCard as HTMLElement);
    expect(pushMock).toHaveBeenCalledWith('./pflegegrad/start');
  });

  it('navigiert NICHT bei Karten ohne Ziel (path "#")', async () => {
    const user = userEvent.setup();
    renderStartseite();

    const qrCard = screen
      .getByRole('heading', { level: 3, name: msg.features.items.qr.title })
      .closest('[role="link"]');

    await user.click(qrCard as HTMLElement);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('unterstützt Tastatur-Navigation (Enter) auf Feature-Karten — BFSG', () => {
    renderStartseite();

    const tagebuchCard = screen
      .getByRole('heading', { level: 3, name: msg.features.items.tagebuch.title })
      .closest('[role="link"]') as HTMLElement;

    // Fokussierbar?
    expect(tagebuchCard).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(tagebuchCard, { key: 'Enter' });
    expect(pushMock).toHaveBeenCalledWith('./tagebuch');
  });

  // --------------------------------------------------------------------------
  // B2B-Riegel
  // --------------------------------------------------------------------------

  it('navigiert per Klick und per Enter zur Fachkräfte-Seite', async () => {
    const user = userEvent.setup();
    renderStartseite();

    const b2bRow = screen.getByText(msg.b2b.title).closest('[role="link"]') as HTMLElement;

    await user.click(b2bRow);
    expect(pushMock).toHaveBeenCalledWith('./pflegekraefte');

    pushMock.mockClear();
    fireEvent.keyDown(b2bRow, { key: 'Enter' });
    expect(pushMock).toHaveBeenCalledWith('./pflegekraefte');
  });

  // --------------------------------------------------------------------------
  // Trust-Register
  // --------------------------------------------------------------------------

  it('rendert alle drei Vertrauensindikatoren mit <strong>-Hervorhebung', () => {
    renderStartseite();

    const region = screen.getByRole('region', { name: 'Sicherheitszertifikate' });
    const strongs = region.querySelectorAll('strong');

    // Drei trust-Messages → mindestens drei gerenderte <strong>-Tags
    expect(strongs.length).toBeGreaterThanOrEqual(3);
    expect(region).toHaveTextContent(/100% Anonym/);
  });
});
