# PDF-Erzeugung

Serverseitiges Rendern von HTML zu A4-PDF über Puppeteer. Genutzt von den drei
PDF-Routen (`pdf/generate`, `widerspruch/pdf`, `briefe/pdf`), die alle im
**Node.js-Runtime** laufen (Chromium braucht Node, kein Edge).

## Chromium je Umgebung

`launchPDFBrowser()` ([puppeteer.ts](puppeteer.ts)) wählt den Browser nach
folgender Reihenfolge — die erste zutreffende Regel gewinnt:

| # | Bedingung | Chromium | Headless |
| --- | --- | --- | --- |
| 1 | `PUPPETEER_EXECUTABLE_PATH` gesetzt | dieser Pfad | `true` |
| 2 | Serverless (`AWS_LAMBDA_FUNCTION_NAME` oder `VERCEL`) | `@sparticuz/chromium` | `'shell'` |
| 3 | macOS-Entwicklung | System-Google-Chrome | `true` |
| 4 | lokale Linux-Entwicklung | `/usr/bin/chromium` | `true` |

Der Serverless-Zweig (2) ist der eigentliche Fix: Auf Vercel existiert
`/usr/bin/chromium` **nicht**, weshalb die PDF-Erzeugung dort ohne
`@sparticuz/chromium` fehlschlug. Das Paket liefert ein Lambda-taugliches
Chromium-Binary samt passender Startflags.

## Bundling (wichtig)

`@sparticuz/chromium` löst seinen Binary-Pfad über **relative Pfade** auf; ein
Bundling durch Webpack/Turbopack zerbricht das. Deshalb sind sowohl
`@sparticuz/chromium` als auch `puppeteer-core` in
[next.config.ts](../../../next.config.ts) als `serverExternalPackages`
eingetragen. **Diese Einträge nicht entfernen** — sonst schlägt die
PDF-Erzeugung in Produktion wieder fehl.

## Laufzeit-Ressourcen auf Vercel

- **Timeout:** je Route über `export const maxDuration = 60` gesetzt (Chromium
  braucht mehr als die 10-Sekunden-Standardgrenze).
- **Memory:** Vercels Standard ist **1024 MB** und erfüllt damit die
  Mindestanforderung. Next.js kennt kein `export const memory`; für mehr
  Speicher (große/komplexe PDFs) im Vercel-Dashboard unter
  **Settings → Functions → Memory** anheben (Richtwert 1536–2048 MB).

## Versionen

- `puppeteer-core` und `@sparticuz/chromium` in `dependencies` (Runtime, nicht
  dev). `@sparticuz/chromium@149` liefert Chromium 149; `puppeteer-core@25.4`
  spricht Chrome 151 — der geringe Versportand ist für `printToPDF`/`setContent`
  über CDP unkritisch. Bei einem Update beide Pakete im Blick behalten.

## Verifikation nach Deployment

Die reale Serverless-Ausführung lässt sich nur im Deployment prüfen (lokal
greift Zweig 3/4). Nach einem Vercel-Preview-Deployment einen bezahlten Fall
je Route durchspielen und ein valides, nicht-leeres PDF (kein 500) bestätigen.
