// src/app/[locale]/page.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Startseite from './page';

// Best Practice: Next.js Navigation mit Vitest (vi) mocken
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
    useParams: () => ({
        locale: 'de',
    }),
}));

describe('Startseite - Hydration & Session Flow', () => {
    beforeEach(() => {
        // Bereinigt alle Mocks vor jedem Testlauf
        vi.clearAllMocks();

        // LocalStorage für den Test vorbereiten
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => null);
    });

    it('sollte im Kaltstart (keine Session) den Standard-Text anzeigen', () => {
        render(<Startseite />);

        // Findet den Text der ersten Karte beim ersten Render-Zyklus
        expect(screen.getByText('Pflegegrad prüfen')).toBeInTheDocument();
    });

    it('sollte den Button-Text nach Hydration anpassen, wenn Session aktiv ist', async () => {
        // Simuliere, dass ein Eintrag im localStorage existiert
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
            if (key === 'case_code') return 'active_session_123';
            return null;
        });

        render(<Startseite />);

        // Da der localStorage-Check im useEffect (asynchron) läuft,
        // müssen wir mit `waitFor` auf die UI-Änderung warten.
        await waitFor(() => {
            expect(screen.getByText('Analyse ansehen')).toBeInTheDocument();
        });
    });
});