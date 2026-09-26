# syntax=docker/dockerfile:1
#
# Abbild der Anwendung für den eigenen Server (#177, ADR-0003).
#
# Drei Stufen, damit im Laufzeit-Abbild weder Quelltext noch Build-Werkzeuge
# landen: `deps` installiert, `builder` baut, `runner` führt aus. Übertragen
# wird nur, was `next build` im Standalone-Modus als nötig ermittelt hat.

ARG NODE_VERSION=22.13.1

# ---------------------------------------------------------------------------
# 1. Abhängigkeiten
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS deps
WORKDIR /app

# Nur die beiden Dateien kopieren, von denen die Installation abhängt: Solange
# sie sich nicht ändern, holt Docker diese Stufe aus dem Zwischenspeicher.
COPY package.json package-lock.json ./

# `npm ci` statt `npm install`: installiert exakt den Stand aus package-lock,
# ohne ihn fortzuschreiben. Ein Build darf keine Abhängigkeit ändern.
RUN --mount=type=cache,target=/root/.npm npm ci

# ---------------------------------------------------------------------------
# 2. Bauen
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Werte mit dem Präfix NEXT_PUBLIC_ werden von Next beim Bauen in das
# Browser-Bündel geschrieben. Sie können deshalb NICHT erst beim Start gesetzt
# werden — das Abbild gehört dadurch zu genau einer Umgebung.
#
# Geheim ist nichts davon: Der Anon-Key ist für den Browser bestimmt und wird
# durch RLS getragen. Trotzdem stehen diese Werte anschließend in der
# Abbild-Historie — echte Geheimnisse haben hier nichts zu suchen.
#
# Die Folge für die Auslieferung: Ein Digest lässt sich nicht von einer
# Umgebung in die nächste durchreichen, solange diese Werte eingebacken sind
# (offene Entscheidung in #178).
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID
ARG NEXT_PUBLIC_UMAMI_SRC

ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL} \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY} \
    NEXT_PUBLIC_URL=${NEXT_PUBLIC_URL} \
    NEXT_PUBLIC_UMAMI_WEBSITE_ID=${NEXT_PUBLIC_UMAMI_WEBSITE_ID} \
    NEXT_PUBLIC_UMAMI_SRC=${NEXT_PUBLIC_UMAMI_SRC} \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---------------------------------------------------------------------------
# 3. Laufzeit
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS runner
WORKDIR /app

# chromium: erzeugt die PDF. Im Abbild statt als Paket aus npm — @sparticuz
# existiert nur, weil AWS Lambda keinen Browser mitbringt.
# fonts-*: ohne Schriften rendert Chromium leere Kästchen statt Text.
# tini: als Prozess 1. Chromium startet Kindprozesse; ohne einen richtigen
#       init sammeln sich deren Reste an, und Signale kommen nicht überall an.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        chromium \
        fonts-liberation \
        fonts-dejavu-core \
        ca-certificates \
        tini \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Der Standalone-Modus legt einen eigenen server.js samt der wirklich
# benötigten node_modules ab. `static` und `public` kopiert er bewusst nicht
# mit — dafür ist sonst ein CDN zuständig. Hier liefert sie der Server selbst.
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# Das node-Abbild bringt diesen Benutzer mit. Nichts an dieser Anwendung
# braucht root — und ein Ausbruch aus Chromium träfe sonst den ganzen Container.
USER node

EXPOSE 3000

# Liveness: Läuft der Prozess? Bewusst NICHT /api/health — das prüft auch die
# Datenbank, und ein Neustart des Containers behebt keine Störung bei Supabase.
# Er würde nur die Anwendung mitreißen (siehe src/app/api/health/route.ts).
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/api/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Next beendet bei SIGTERM von sich aus sauber: laufende Anfragen werden
# fertig bedient, ausstehende after()-Aufgaben noch ausgeführt. Dafür braucht
# es Zeit — die Nachlauffrist steht in der Compose-Datei.
STOPSIGNAL SIGTERM

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.js"]
