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

## Wenn Redis konfiguriert, aber gestört ist

Der gefährlichere Fall ist nicht die fehlende Konfiguration, sondern die
_falsche_: Zugangsdaten gesetzt, Dienst nicht erreichbar. Genau das lag am
21.09.2026 in Produktion vor — der Upstash-Host löste nicht mehr auf (#176).

Ohne Gegenmaßnahme zahlt dann **jede** API-Anfrage denselben Preis: Der
Upstash-Client wiederholt einen fehlgeschlagenen Aufruf standardmäßig sechsmal
mit wachsenden Pausen, zusammen über vier Sekunden — und das in der Middleware,
also vor jeder Route.

Dagegen stehen zwei Dinge:

1. **Client-Konfiguration** ([`client.ts`](client.ts)): ein Wiederholversuch
   ohne Pause statt sechs mit Backoff, dazu ein Zeitlimit von einer Sekunde je
   Aufruf. Damit kostet ein Fehlschlag Millisekunden statt Sekunden.
2. **Verfügbarkeitsschalter** ([`verfuegbarkeit.ts`](verfuegbarkeit.ts)): Nach
   einem Fehlschlag wird Redis 60 Sekunden lang übersprungen. Danach wagt genau
   eine Anfrage einen Versuch; glückt er, ist der Schalter wieder zu.

Gemessen gegen den toten Host: **4369 ms je Aufruf vorher, 8 ms einmal pro
Minute nachher**.

Der Ausfall wird beim Öffnen der Sperre **einmal** protokolliert
(`[redis][degradiert]`), nicht bei jeder Anfrage — sonst gehen echte Fehler im
Rauschen unter. Die Rückkehr ebenso (`[redis][erholt]`).

Während der Störung greift der prozesslokale Limiter. Das Limit entfällt also
nicht, aber seine Reichweite schrumpft auf eine Instanz (siehe #136).
`redisZustand()` gibt den Zustand für den Health-Endpunkt aus #177 heraus —
bewusst nicht über eine öffentliche Route: Die Auskunft „das Rate-Limit ist
gerade prozesslokal" hilft niemandem außer jemandem, der Fallcodes durchprobiert.

## Cache-Sicherheit (wichtig)

Der Cache ist ein **geteilter** Speicher. Gecacht werden ausschließlich Routen,
deren Antwort für **jeden Aufrufer identisch** ist — unabhängig von Session,
Cookie oder Auth.

Die Allowlist steht **hart im Code** ([`edge-cache.ts`](edge-cache.ts)), nicht
in einer Konfiguration:

| Route                            | Cache | Grund                                           |
| -------------------------------- | ----- | ----------------------------------------------- |
| `/api/gesetze`, `/api/gesetze/*` | ✅    | öffentlicher Gesetzestext, für alle gleich      |
| alles mit `requireCaseSession`   | ❌    | fallbezogen — geteilter Cache = Cross-User-Leck |
| POST / mutierende Routen         | ❌    | nicht idempotent                                |

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

| Datei                | Zweck                                                     |
| -------------------- | --------------------------------------------------------- |
| `client.ts`          | Upstash-Client mit Env-Guard (liefert `null` ohne Config) |
| `verfuegbarkeit.ts`  | überspringt Redis nach einem Ausfall für eine Sperrzeit   |
| `rate-limit-edge.ts` | Sliding-Window-Limit + In-Memory-Fallback                 |
| `edge-cache.ts`      | Allowlist, Cache-Schlüssel, Lesen/Schreiben               |
| `with-edge-cache.ts` | Wrapper für die Schreibseite in der Route                 |
| `middleware-api.ts`  | zusammengeführte `/api/*`-Pipeline (testbar)              |
