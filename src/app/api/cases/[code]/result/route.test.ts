import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

const { requireCaseSessionMock, calculateCaseResultMock, supabaseClient } = vi.hoisted(() => ({
  requireCaseSessionMock: vi.fn(),
  calculateCaseResultMock: vi.fn(),
  supabaseClient: { from: vi.fn() },
}));

vi.mock('server-only', () => ({}));
vi.mock('@/src/lib/api/case-auth', () => ({ requireCaseSession: requireCaseSessionMock }));
vi.mock('@/src/lib/pflegegrad/case-result', () => ({
  calculateCaseResult: calculateCaseResultMock,
}));
vi.mock('@/src/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn(() => supabaseClient),
}));

describe('GET /api/cases/[code]/result', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireCaseSessionMock.mockResolvedValue({ caseId: 'case-uuid-1' });
    calculateCaseResultMock.mockResolvedValue({ careLevel: 2, totalScore: 30 });
  });

  it('liefert das serverseitig berechnete Ergebnis ohne Route-seitige Mutation', async () => {
    const response = await GET(new NextRequest('http://localhost/api/cases/PF-1234-5678/result'), {
      params: Promise.resolve({ code: 'PF-1234-5678' }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      ergebnis: { careLevel: 2, totalScore: 30 },
    });
    expect(calculateCaseResultMock).toHaveBeenCalledWith(supabaseClient, 'case-uuid-1');
    expect(supabaseClient.from).not.toHaveBeenCalled();
  });
});
