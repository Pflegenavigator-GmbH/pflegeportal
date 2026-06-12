// vitest.setup.ts
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// 1. LocalStorage global mocken (wird sehr oft benötigt)
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// 2. Fetch global mocken (nützlich für API-Tests)
global.fetch = vi.fn();