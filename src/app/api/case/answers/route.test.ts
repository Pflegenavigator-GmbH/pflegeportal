import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DELETE } from './route';

const { requireCaseSessionMock, rpcMock, handleApiErrorMock, loggerInfoMock } = vi.hoisted(() => ({
  requireCaseSessionMock: vi.fn(),
  rpcMock: vi.fn(),
  handleApiErrorMock: vi.fn(),
  loggerInfoMock: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/src/lib/api/case-auth', () => ({ requireCaseSession: requireCaseSessionMock }));
vi.mock('@/src/lib/api/error-handler', () => ({ handleApiError: handleApiErrorMock }));
vi.mock('@/src/lib/logger', () => ({
  logger: { info: loggerInfoMock, error: vi.fn(), warn: vi.fn() },
}));
vi.mock('@/src/lib/pflegegrad/case-result', () => ({
  calculateAndPersistCaseResult: vi.fn(),
}));
vi.mock('@/src/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn(() => ({ rpc: rpcMock })),
}));

describe('DELETE /api/cases/[code]/answers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireCaseSessionMock.mockResolvedValue({ caseId: 'case-uuid-1' });
    rpcMock.mockResolvedValue({ error: null });
    handleApiErrorMock.mockReturnValue(NextResponse.json({ error: 'failed' }, { status: 500 }));
  });

  it('delegiert den Erwachsenen-Reset an die transaktionale Datenbankfunktion', async () => {
    const response = await DELETE(
      new NextRequest('http://localhost/api/cases/PF-1234-5678/answers', { method: 'DELETE' })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    // Seit #135 ohne Argument: Der Fall kommt aus der Sitzung.
    expect(requireCaseSessionMock).toHaveBeenCalledWith();
    expect(rpcMock).toHaveBeenCalledOnce();
    expect(rpcMock).toHaveBeenCalledWith('reset_adult_assessment', {
      p_case_id: 'case-uuid-1',
    });
  });

  it('liefert bei einem fehlgeschlagenen Reset keinen falschen Erfolg', async () => {
    const databaseError = new Error('reset failed');
    rpcMock.mockResolvedValue({ error: databaseError });

    const response = await DELETE(
      new NextRequest('http://localhost/api/cases/PF-1234-5678/answers', { method: 'DELETE' })
    );

    expect(response.status).toBe(500);
    // Der Fallcode wird nicht an den Error-Handler durchgereicht — er landete
    // sonst im Laufzeit-Log und in system_logs (Issue #145).
    expect(handleApiErrorMock).toHaveBeenCalledWith(databaseError, 'api.cases.answers.delete');
    expect(loggerInfoMock).not.toHaveBeenCalled();
  });
});
