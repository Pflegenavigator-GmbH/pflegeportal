# Edge-Middleware: Rate-Limit & öffentlicher Cache

Globale Middleware für Sicherheit und Performance der API. Umgesetzt in
[`src/proxy.ts`](../../proxy.ts) (diese Next-Version nutzt `proxy.ts` statt
`middleware.ts`), die Logik liegt testbar in diesem Verzeichnis.

## Ablauf pro Anfrage

```
Anfrage /api/*
  │
  ├─ 1. Rate-Limit (IP, Sliding Window 60/min)
  │      └─ überschritten → 429 + Retry-After   (Route wird NIE ausgeführt)
  │
  ├─ 2. Nur GET auf Allowlist-Route:
  │      └─ Cache-HIT → sofort zurück, X-Cache: HIT   (keine Function-Invocation)
  │
  └─ 3. sonst durchreichen → Route läuft
         └─ withEdgeCache schreibt Ergebnis, setzt X-Cache: MISS
```

Seiten (nicht `/api/*`) laufen weiterhin durch das `next-intl`-Locale-Routing.

## Konfiguration

Zwei Umgebungsvariablen (Upstash-Konsole → REST-API):

```
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxx
```

**Optional.** Ohne sie:

- Rate-Limit fällt auf den prozesslokalen In-Memory-Limiter zurück
  ([`src/lib/api/rate-limit.ts`](../api/rate-limit.ts)). In einer verteilten
  Edge-Umgebung nur ein Näherungswert, aber besser als kein Limit.
- Der Cache wird übersprungen (jede Anfrage ist ein Miss).

Lokale Entwicklung und CI laufen damit ohne Redis.

## Cache-Sicherheit (wichtig)

Der Cache ist ein **geteilter** Speicher. Gecacht werden ausschließlich Routen,
deren Antwort für **jeden Aufrufer identisch** ist — unabhängig von Session,
Cookie oder Auth.

Die Allowlist steht **hart im Code** ([`edge-cache.ts`](edge-cache.ts)), nicht
in einer Konfiguration:

| Route | Cache | Grund |
| --- | --- | --- |
| `/api/gesetze`, `/api/gesetze/*` | ✅ | öffentlicher Gesetzestext, für alle gleich |
| alles mit `requireCaseSession` | ❌ | fallbezogen — geteilter Cache = Cross-User-Leck |
| POST / mutierende Routen | ❌ | nicht idempotent |

**Eine neue Route nur dann in `CACHE_REGELN` aufnehmen, wenn ihre Antwort
garantiert für alle Nutzer identisch ist.** Der Test
[`edge-cache.test.ts`](edge-cache.test.ts) sichert diese Invariante ab.

## Security-Header

Werden **nicht** hier gesetzt, sondern zentral in
[`next.config.ts`](../../../next.config.ts) via `headers()` für `/:path*`
(CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
Permissions-Policy). Eine Doppelung in der Middleware würde nur
Konfliktrisiken schaffen.

## Dateien

| Datei | Zweck |
| --- | --- |
| `client.ts` | Upstash-Client mit Env-Guard (liefert `null` ohne Config) |
| `rate-limit-edge.ts` | Sliding-Window-Limit + In-Memory-Fallback |
| `edge-cache.ts` | Allowlist, Cache-Schlüssel, Lesen/Schreiben |
| `with-edge-cache.ts` | Wrapper für die Schreibseite in der Route |
| `middleware-api.ts` | zusammengeführte `/api/*`-Pipeline (testbar) |
