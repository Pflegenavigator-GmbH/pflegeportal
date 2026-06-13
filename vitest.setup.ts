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

const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// 3. Fetch global mocken (nützlich für API-Tests)
global.fetch = vi.fn();