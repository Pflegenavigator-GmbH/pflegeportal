# Sicherheit

## Prüfungen im CI

Werkzeuge mit unterschiedlichem Gegenstand — sie ergänzen sich und ersetzen
einander **nicht**:

| Prüfung | Werkzeug | Wo | Blockierend | Gegenstand |
| --- | --- | --- | --- | --- |
| Abhängigkeiten | Snyk Open Source | Job `security` | ja | Bekannte Lücken in Produktions-Paketen |
| Eigener Code (SAST) | CodeQL `security-extended` | `codeql.yml` | ja | Injection, unsichere Datenflüsse u.ä. |
| Zugangsdaten | Gitleaks | Job `secrets-scan` | ja | Secrets in der gesamten Git-History |
| Dateisystem / IaC | Trivy | Job `trivy` | ja | Abhängigkeiten und Konfigurationsdateien |
| Gegenprobe | `npm audit` | Job `security` | nein | Zweitmeinung ohne Drittanbieter |
| Laufzeit | Playwright | Job `e2e` | ja | Startet der Produktions-Build im Browser? |
| Bundle-Größe | compressed-size-action | Job `bundle-size` | nein | Kommentar am PR bei Wachstum |

Alle blockierenden Gates greifen ab Schweregrad **High**. Der Snyk-Scan
benötigt das Repository-Secret `SNYK_TOKEN`; alle übrigen Werkzeuge sind Open
Source und brauchen weder Konto noch Lizenz.

### Gitleaks: warum die CLI statt der Action

`gitleaks/gitleaks-action@v2` ist für **Organisationen** lizenzpflichtig
(`GITLEAKS_LICENSE`). Dieses Repository gehört einer GmbH-Organisation. Die
CLI selbst steht unter Apache-2.0 und ist uneingeschränkt frei — deshalb läuft
sie im Job direkt über das offizielle Container-Image.

Zwei Details, die nicht kosmetisch sind:

- **`fetch-depth: 0`** — ohne die volle History sieht Gitleaks nur den letzten
  Commit. Ein Schlüssel, der vor drei Commits hinzugefügt und danach wieder
  entfernt wurde, steht weiterhin im Verlauf und ist damit kompromittiert.
- **`--redact`** — ohne diese Option schreibt Gitleaks den gefundenen
  Klartext-Schlüssel ins Job-Log. Bei einem öffentlichen Repository wäre das
  für jeden lesbar; der Fund würde das Leck selbst verbreiten.

**Bekannte Ausnahme:** `.gitleaks.toml` nimmt `.env.example` aus. Die Datei ist
absichtlich versioniert und enthält Attrappen mit Zählmustern
(`sk_test_1234…`, `whsec_123456…`), die Gitleaks' Stripe- und
Generic-API-Key-Regeln erwartungsgemäß treffen — acht Funde, alle unecht,
geprüft am 02.08.2026. Ohne die Ausnahme wäre der Job dauerhaft rot und würde
genau das verlieren, wofür er da ist. Die Ausnahme ist auf diesen einen
Dateipfad verankert; ein echter Schlüssel in jeder anderen Datei wird
weiterhin gefunden (gegengeprüft).

### Trivy: heutiger Nutzen, ehrlich eingeordnet

Lokal gegen Trivy v0.72 geprüft: Der `vuln`-Scan liest `package-lock.json` und
meldet **0 Funde** — dieselbe Grundlage, die Snyk bereits blockierend prüft.
Der `misconfig`-Scanner unterstützt Dockerfile, Terraform, Kubernetes, Helm
und CloudFormation; nichts davon existiert in diesem Repository, er meldet
entsprechend „Not scanned". GitHub-Actions-Workflows gehören **nicht** zu
seinen Zielen.

Der Job trägt heute also nichts bei, was Snyk nicht schon leistet. Er bleibt
trotzdem: Er greift ohne Änderung, sobald ein Dockerfile oder IaC dazukommt,
und hat anders als Snyk kein Scan-Kontingent. Wer die Dublette stört, kann ihn
streichen — dann bleibt die Abhängigkeitsprüfung allein bei Snyk.

CodeQL ist auf öffentlichen Repositories kostenlos. Wird das Repository privat
gestellt, setzt Code Scanning **GitHub Advanced Security** voraus; ohne GHAS
scheitert der Ergebnis-Upload. Ersatz wäre dann `npx snyk code test` im
`security`-Job (Kommentar dort vorhanden). Solange CodeQL läuft, bleibt Snyk
Code bewusst draußen — zwei SAST-Werkzeuge erzeugen doppelte Befunde.

### Log-Injection: warum `sauberFuerLog` so aussieht, wie es aussieht

`src/lib/log-safe.ts` bereinigt nutzergesteuerte Werte vor `console.*`. Die
Schreibweise der `replace`-Aufrufe ist nicht kosmetisch: CodeQL erkennt einen
Sanitizer nur, wenn der ersetzte Wert konstant auflösbar ist
(`StringReplaceCall.getAReplacedString()` castet die Regex-Wurzel auf
`RegExpConstant`). Nur ein nacktes Literal wie `/\n/g` erfüllt das.

Nicht erkannt werden — obwohl zur Laufzeit gleichwertig:

- `/[\r\n]+/g` — Zeichenklasse unter einem Quantor, keine Konstanten-Wurzel
- `/\r|\n/g` — Alternation, ebenfalls keine Konstanten-Wurzel
- eine Zeichen-für-Zeichen-Schleife

Beide zuvor probierten Varianten (Schleife, Zeichenklasse) ließen den Befund
`js/log-injection` bestehen. Die aktuelle Form mit getrennten `/\n/g`- und
`/\r/g`-Aufrufen darf deshalb nicht „vereinfacht" werden.

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
