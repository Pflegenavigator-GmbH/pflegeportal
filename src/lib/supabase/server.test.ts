import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createServerSupabaseClient } from '@/src/lib/supabase/server';

// Mocks müssen vor den Importen stehen oder direkt hier
vi.mock('next/headers');
vi.mock('@supabase/ssr');

describe('createServerSupabaseClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Wir definieren den Rückgabetyp explizit für den Mock
    // Awaited<ReturnType<typeof cookies>> entspricht dem Typ, den cookies() zurückgibt
    type CookieStore = Awaited<ReturnType<typeof cookies>>;

    const mockCookieStore: Partial<CookieStore> = {
      getAll: vi.fn().mockReturnValue([{ name: 'sb-test', value: '123' }]),
      set: vi.fn(),
    };

    vi.mocked(cookies).mockResolvedValue(mockCookieStore as CookieStore);
  });

  it('sollte den Supabase Client korrekt initialisieren', async () => {
    await createServerSupabaseClient();

    expect(createServerClient).toHaveBeenCalledWith(
      expect.any(String), // URL
      expect.any(String), // Key
      expect.objectContaining({
        cookies: expect.any(Object),
      })
    );
  });
});
