import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

const { requireCaseSessionMock, loadAssessmentStateMock, supabaseClient } = vi.hoisted(() => ({
  requireCaseSessionMock: vi.fn(),
  loadAssessmentStateMock: vi.fn(),
  supabaseClient: { from: vi.fn() },
}));

vi.mock('server-only', () => ({}));
vi.mock('@/src/lib/api/case-auth', () => ({ requireCaseSession: requireCaseSessionMock }));
vi.mock('@/src/lib/pflegegrad/case-result', () => ({
  loadAdultAssessmentState: loadAssessmentStateMock,
}));
vi.mock('@/src/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn(() => supabaseClient),
}));

describe('GET /api/cases/[code]/result', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireCaseSessionMock.mockResolvedValue({ caseId: 'case-uuid-1' });
    loadAssessmentStateMock.mockResolvedValue({
      hasResult: true,
      nextModule: null,
      result: { careLevel: 2, totalScore: 30 },
    });
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
    expect(loadAssessmentStateMock).toHaveBeenCalledWith(supabaseClient, 'case-uuid-1');
    expect(supabaseClient.from).not.toHaveBeenCalled();
  });

  it('liefert bei einem unvollständigen Assessment den serverseitigen Wiedereinstiegspunkt', async () => {
    loadAssessmentStateMock.mockResolvedValue({
      hasResult: false,
      nextModule: 4,
      result: { missingData: true },
    });

    const response = await GET(new NextRequest('http://localhost/api/cases/PF-1234-5678/result'), {
      params: Promise.resolve({ code: 'PF-1234-5678' }),
    });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      success: false,
      error: 'Das Assessment ist noch nicht vollständig.',
      nextModule: 4,
    });
  });
});
