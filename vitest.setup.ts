// vitest.setup.ts
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// 1. Umgebungsvariablen global stubben
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://mock.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'mock-key');

// 2. CookieStore-Mocking (da dies in fast allen Server-Supabase-Tests vorkommt)
vi.mock('next/headers', () => ({
    cookies: vi.fn().mockResolvedValue({
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn(),
    }),
}));

// localStorage-Attrappe MIT Zustand. Zuvor waren es leere vi.fn() — `getItem`
// lieferte immer `undefined`, egal was zuvor geschrieben wurde. Tests, die
// einen Schreib-/Lesezyklus prüfen (Einwilligung, Fallcode), konnten damit
// nicht funktionieren. Weiterhin vi.fn(), damit Aufruf-Zusicherungen
// (toHaveBeenCalledWith) unverändert möglich bleiben.
let localStorageDaten: Record<string, string> = {};
const localStorageMock = {
    getItem: vi.fn((schluessel: string) =>
        Object.prototype.hasOwnProperty.call(localStorageDaten, schluessel)
            ? localStorageDaten[schluessel]
            : null
    ),
    setItem: vi.fn((schluessel: string, wert: string) => {
        localStorageDaten[schluessel] = String(wert);
    }),
    removeItem: vi.fn((schluessel: string) => {
        delete localStorageDaten[schluessel];
    }),
    clear: vi.fn(() => {
        localStorageDaten = {};
    }),
    key: vi.fn((index: number) => Object.keys(localStorageDaten)[index] ?? null),
    get length() {
        return Object.keys(localStorageDaten).length;
    },
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    configurable: true,
});

// 3. Fetch global mocken (nützlich für API-Tests)
global.fetch = vi.fn();