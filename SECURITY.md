# Sicherheit

## Prüfungen im CI

Der Job `security` in `.github/workflows/ci.yml` ist **blockierend ab
Schweregrad High** und umfasst drei Prüfungen:

| Prüfung | Werkzeug | Gegenstand |
| --- | --- | --- |
| Abhängigkeiten | Snyk Open Source | Bekannte Lücken in Produktions-Paketen |
| Eigener Code (SAST) | Snyk Code | Injection, unsichere Datenflüsse u.ä. |
| Gegenprobe | `npm audit` | Zweitmeinung ohne Drittanbieter, informativ |

Der Snyk-Scan benötigt das Repository-Secret `SNYK_TOKEN`.

### Warum Snyk statt CodeQL

CodeQL Code Scanning setzt auf **privaten** Repositories GitHub Advanced
Security voraus. Da dieses Repository privat ist, übernimmt **Snyk Code** die
statische Analyse des eigenen Codes — sonst entstünde eine Lücke: Snyk Open
Source prüft nur Abhängigkeiten, nicht den eigenen Quelltext.

`.github/workflows/codeql.yml` bleibt bewusst bestehen, steht aber auf
`continue-on-error: true` und blockiert keine Pull Requests. Sobald GHAS
aktiviert wird, greift CodeQL ohne weitere Änderung wieder; dann sollte der
Snyk-Code-Schritt entfallen, damit dieselben Befunde nicht doppelt auflaufen.

### Produktions-Audit lokal

Maßgeblich für Handarbeit bleibt der Produktions-Audit:

```bash
npm audit --omit=dev --audit-level=high
```

Er muss `found 0 vulnerabilities` liefern und prüft ausschließlich
Abhängigkeiten, die im ausgelieferten Code landen — nur diese sind für Nutzer
relevant. Auch `snyk test` scannt standardmäßig nur Produktions-Abhängigkeiten.

Ein voller `npm audit` (inkl. `devDependencies`) kann zusätzliche Findings
zeigen, die Build-/Lint-Werkzeuge betreffen. Solche Findings erreichen weder
die Produktion noch die Nutzer und blockieren den CI-Gate nicht. Jedes
bewusst akzeptierte Finding ist unten dokumentiert.

## Akzeptierte Findings (dev-only)

### `brace-expansion` — DoS (GHSA-mh99-v99m-4gvg)

- **Status:** akzeptiert, kein Handlungsbedarf für Produktion.
- **Scope:** ausschließlich `devDependencies` (ESLint-Toolchain:
  `eslint`, `eslint-config-next`, `eslint-plugin-import-x`,
  `typescript-eslint` → `minimatch` → `brace-expansion`). Keine
  Produktions-Abhängigkeit zieht `brace-expansion`.
- **Warum unkritisch:** Die tatsächlich installierte Version
  `brace-expansion@1.1.16` enthält den Fix bereits (gepatcht seit 1.1.12).
  Die Advisory drückt die verwundbare Spanne jedoch als eine durchgehende
  Range `<=5.0.7` aus, die die gepatchten 1.1.x-Versionen mit erfasst — ein
  False-Positive. Die reale Angriffsfläche wäre ohnehin nur ein
  Linter-Speicherverbrauch bei lokal ausgeführten, bösartig konstruierten
  Glob-Mustern.
- **Warum nicht „gefixt":** Zwei Wege wurden geprüft und beide verworfen:
  1. `overrides` auf `brace-expansion@5.x` bricht `minimatch@3` (unter
     `eslint@9`) — API-inkompatibler Major-Sprung, ESLint schlägt fehl
     (getestet, wieder zurückgerollt).
  2. `eslint@10` (der Weg von `npm audit fix --force`) **crasht** mit dem
     aktuellen `eslint-config-next`: dessen gebündeltes
     `eslint-plugin-react` ruft `context.getFilename()` auf — eine in
     ESLint 10 entfernte API (`TypeError: contextOrFilename.getFilename is
     not a function`). Zudem verschiebt ESLint 10 die
     `brace-expansion`-Kette nur nach `eslint-config-next/node_modules`,
     statt sie zu beseitigen. Beide Ziele (Lint lauffähig, Audit sauber)
     verfehlt — getestet und zurückgerollt.
- **Auflösung:** entfällt automatisch, sobald `eslint-config-next` ein
  ESLint-10-kompatibles `eslint-plugin-react` (und aktualisiertes `minimatch`)
  ausliefert. Bis dahin bleibt ESLint 9 die einzige lauffähige Version.
  Dependabot-PR für `eslint@10` daher **nicht mergen**, bis der Upstream-Fix
  vorliegt.

## Ein Sicherheitsproblem melden

Sicherheitsrelevante Funde bitte nicht als öffentliches Issue, sondern direkt
an das Team.
