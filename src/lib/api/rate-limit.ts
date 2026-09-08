// src/lib/api/rate-limit.ts
// Einfaches In-Memory-Sliding-Window-Rate-Limit. Bewusst prozesslokal:
// bei "output: standalone" auf einem einzelnen Hetzner-Server ausreichend.
// Bei horizontaler Skalierung durch einen Redis-basierten Limiter ersetzen.

const buckets = new Map<string, number[]>();
const MAX_BUCKETS = 10_000;

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Speicher begrenzen, falls sehr viele unterschiedliche Keys auflaufen
  if (buckets.size > MAX_BUCKETS) {
    buckets.clear();
  }

  const timestamps = (buckets.get(key) || []).filter((t) => t > windowStart);

  if (timestamps.length >= limit) {
    buckets.set(key, timestamps);
    return false;
  }

  timestamps.push(now);
  buckets.set(key, timestamps);
  return true;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}
