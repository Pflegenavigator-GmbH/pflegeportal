// src/lib/system-log.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FALLCODE_ERSATZ } from './log-schwaerzung';
import { schreibeSystemLog } from './system-log';

const { insertMock, loggerErrorMock } = vi.hoisted(() => ({
  insertMock: vi.fn(),
  loggerErrorMock: vi.fn(),
}));

vi.mock('@/src/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn(() => ({ from: vi.fn(() => ({ insert: insertMock })) })),
}));

vi.mock('@/src/lib/logger', () => ({
  logger: { error: loggerErrorMock },
}));

describe('schreibeSystemLog (#145)', () => {
  beforeEach(() => {
    insertMock.mockReset().mockResolvedValue({ error: null });
    loggerErrorMock.mockReset();
  });

  it('schwärzt Fallcodes in Meldung und Metadaten, bevor sie die Datenbank erreichen', async () => {
    await schreibeSystemLog({
      level: 'error',
      source: 'api.test',
      message: 'Fall nicht gefunden: PF-AB12-CD34',
      metadata: { context: { expectedCode: 'PF-AB12-CD34' }, code: 'NOT_FOUND' },
    });

    const zeile = insertMock.mock.calls[0][0];
    expect(JSON.stringify(zeile)).not.toMatch(/PF-AB12-CD34/);
    expect(zeile.message).toBe(`Fall nicht gefunden: ${FALLCODE_ERSATZ}`);
    expect(zeile.metadata).toEqual({
      context: { expectedCode: FALLCODE_ERSATZ },
      code: 'NOT_FOUND',
    });
  });

  it('befüllt die Spalte case_code nicht mehr', async () => {
    await schreibeSystemLog({ level: 'info', source: 'api.test', message: 'x' });

    expect(insertMock.mock.calls[0][0]).not.toHaveProperty('case_code');
  });

  it('legt den Fallbezug als caseId in die Metadaten', async () => {
    await schreibeSystemLog({
      level: 'info',
      source: 'stripe.webhook',
      message: 'freigeschaltet',
      caseId: '0b0f1e2a-uuid',
      metadata: { session_id: 'cs_123' },
    });

    expect(insertMock.mock.calls[0][0].metadata).toEqual({
      session_id: 'cs_123',
      caseId: '0b0f1e2a-uuid',
    });
  });

  it('wirft nicht, wenn die Datenbank den Eintrag ablehnt', async () => {
    insertMock.mockResolvedValue({ error: { message: 'permission denied' } });

    await expect(
      schreibeSystemLog({ level: 'error', source: 'api.test', message: 'x' })
    ).resolves.toBeUndefined();
    expect(loggerErrorMock).toHaveBeenCalledTimes(1);
  });
});
