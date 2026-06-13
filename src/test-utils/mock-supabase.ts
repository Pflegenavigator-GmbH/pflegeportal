// src/test-utils/mock-supabase.ts
import { vi } from 'vitest';

export const createMockSupabaseClient = () => ({
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  }),
});

export const mockSupabase = createMockSupabaseClient();
