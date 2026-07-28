# Sicherheit

## Audit-Haltung

Maßgeblich ist der **Produktions-Audit**:

```bash
npm audit --omit=dev --audit-level=high
```

Dieser Befehl läuft im CI (Job `audit`) und muss `found 0 vulnerabilities`
liefern. Er prüft ausschließlich Abhängigkeiten, die im ausgelieferten Code
landen — nur diese sind für Nutzer relevant.

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
- **Warum nicht „gefixt":** Ein `overrides`-Zwang auf `brace-expansion@5.x`
  bricht `minimatch@3` (unter `eslint@9`) — API-inkompatibler Major-Sprung,
  ESLint schlägt dann fehl (getestet). `npm audit fix --force` würde
  `eslint@10` (Breaking Major) installieren.
- **Auflösung:** entfällt automatisch, sobald `eslint-config-next` seine
  `minimatch`-Kette aktualisiert, oder mit der geplanten ESLint-10-Migration.

## Ein Sicherheitsproblem melden

Sicherheitsrelevante Funde bitte nicht als öffentliches Issue, sondern direkt
an das Team.
