import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { leseCache } from './edge-cache';
import { handleApiRequest } from './middleware-api';
import { rateLimit } from './rate-limit-edge';

vi.mock('./rate-limit-edge', () => ({ rateLimit: vi.fn() }));
vi.mock('./edge-cache', async (original) => ({
  // Allowlist-Logik echt lassen, nur die Redis-Leseseite mocken.
  ...(await original<typeof import('./edge-cache')>()),
  leseCache: vi.fn(),
}));

const rateLimitMock = vi.mocked(rateLimit);
const leseCacheMock = vi.mocked(leseCache);

const erlaubt = { erlaubt: true, limit: 60, verbleibend: 59, reset: Date.now() + 60_000 };
const geblockt = { erlaubt: false, limit: 60, verbleibend: 0, reset: Date.now() + 30_000 };

const anfrage = (pfad: string, method = 'GET') =>
  new NextRequest(`https://example.test${pfad}`, { method });

describe('handleApiRequest', () => {
  beforeEach(() => {
    rateLimitMock.mockReset();
    leseCacheMock.mockReset();
  });

  afterEach(() => vi.clearAllMocks());

  it('blockt mit 429, bevor Cache oder Route erreicht werden', async () => {
    rateLimitMock.mockResolvedValue(geblockt);

    const res = await handleApiRequest(anfrage('/api/gesetze'));

    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBeTruthy();
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(leseCacheMock).not.toHaveBeenCalled();
  });

  it('liefert einen Cache-Treffer mit X-Cache: HIT und ohne Routenaufruf', async () => {
    rateLimitMock.mockResolvedValue(erlaubt);
    leseCacheMock.mockResolvedValue({
      status: 200,
      body: '{"gesetze":[]}',
      contentType: 'application/json',
    });

    const res = await handleApiRequest(anfrage('/api/gesetze'));

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cache')).toBe('HIT');
    expect(await res.text()).toBe('{"gesetze":[]}');
  });

  it('reicht bei Cache-Miss durch (kein X-Cache-Header)', async () => {
    rateLimitMock.mockResolvedValue(erlaubt);
    leseCacheMock.mockResolvedValue(null);

    const res = await handleApiRequest(anfrage('/api/gesetze'));

    expect(res.headers.get('X-Cache')).toBeNull();
    expect(res.headers.get('X-RateLimit-Limit')).toBe('60');
  });

  it('fragt den Cache NICHT für fallbezogene Routen ab', async () => {
    rateLimitMock.mockResolvedValue(erlaubt);

    await handleApiRequest(anfrage('/api/cases/PF-1663-4638/result'));

    expect(leseCacheMock).not.toHaveBeenCalled();
  });

  it('cacht keine POST-Anfrage, auch auf einer cachebaren Route', async () => {
    rateLimitMock.mockResolvedValue(erlaubt);

    await handleApiRequest(anfrage('/api/gesetze', 'POST'));

    expect(leseCacheMock).not.toHaveBeenCalled();
  });
});
