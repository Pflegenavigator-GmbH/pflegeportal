import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

// 1. Initialisiere das next-intl Plugin mit dem Pfad zu deiner request-Datei
const withNextIntl = createNextIntlPlugin(
    './src/i18n/request.ts'
);

// Lazy load bundle analyzer only when ANALYZE is true
let withAnalyzer: (config: NextConfig) => NextConfig = (config) => config;

if (process.env.ANALYZE === "true") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const withBundleAnalyzer = require("@next/bundle-analyzer")({ enabled: true });
    withAnalyzer = withBundleAnalyzer;
}

// CSP-Konfiguration
// 'unsafe-eval' braucht nur der Dev-Server (React Refresh) — in Produktion raus.
//
// Für den 3D-Avatar (three.js) nötig und bitte nicht entfernen:
//  - 'wasm-unsafe-eval' in script-src: der Draco-Decoder ist WebAssembly.
//    Ohne diesen Eintrag läuft es in Dev (dort greift 'unsafe-eval'), scheitert
//    aber in Produktion.
//  - blob: in connect-src: three lädt Texturen aus dem GLB über Blob-URLs.
// Der Draco-Decoder wird bewusst lokal aus /public/draco geladen, damit kein
// Drittanbieter-Abruf (Google-CDN) nötig ist — siehe AvatarWidget.tsx.
const isDev = process.env.NODE_ENV === "development";
const scriptSrcExtra = isDev ? " 'unsafe-eval'" : "";

// Umami-Cloud: `eu.umami.is` ist die EU-Region (dort liegt unser Konto),
// `analytics.umami.is` die globale. Beide stehen hier, damit ein Regionswechsel
// nicht zu einer stillen CSP-Blockade führt. Wer Umami selbst hostet, ergänzt
// den eigenen Host — sonst lädt das Skript nicht.
const UMAMI = "https://eu.umami.is https://analytics.umami.is";

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self'${scriptSrcExtra} 'wasm-unsafe-eval' 'unsafe-inline' ${UMAMI};
  script-src-elem 'self' 'unsafe-inline' ${UMAMI};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://*.supabase.co https://images.unsplash.com;
  font-src 'self';
  connect-src 'self' blob: https://*.supabase.co wss://*.supabase.co https://api.openai.com ${UMAMI};
  media-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  block-all-mixed-content;
  upgrade-insecure-requests;
`;

const securityHeaders = [
    { key: "Content-Security-Policy", value: ContentSecurityPolicy.replace(/\s{2,}/g, " ").trim() },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-DNS-Prefetch-Control", value: "on" },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), interest-cohort=()" },
];

const nextConfig: NextConfig = {
    // `output: "standalone"` ist bewusst NICHT gesetzt.
    //
    // Der Modus kopiert die Serverdateien nach `.next/standalone` und ist für
    // Eigenhosting oder Docker gedacht. Dieses Projekt läuft auf Vercel; dort
    // legt die Plattform die Serverdateien selbst ab und meldet im Build
    // ausdrücklich „Applying modifyConfig from Vercel". Ein Dockerfile gibt es
    // im Repo nicht, in der CI wird der Ordner nirgends referenziert — er
    // wurde also von niemandem genutzt.

    images: {
        unoptimized: true,
        formats: ["image/webp", "image/avif"],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        minimumCacheTTL: 60,
        dangerouslyAllowSVG: true,
    },

    // typescript.ignoreBuildErrors war während der Altcode-Migration aktiv und
    // hat die strikte tsconfig im Produktions-Build neutralisiert — entfernt.

    async headers() {
        return [{ source: "/:path*", headers: securityHeaders }];
    },

    // @sparticuz/chromium löst seinen Binary-Pfad über relative Pfade auf; ein
    // Bundling durch Webpack/Turbopack zerbricht das. Beide Puppeteer-Pakete
    // bleiben deshalb als externe Server-Pakete unangetastet — sonst schlägt
    // die PDF-Erzeugung auf Vercel fehl.
    serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],

    experimental: {
        globalNotFound: true,
        optimizePackageImports: [
            "lucide-react",
            "@radix-ui/react-separator",
            "@supabase/supabase-js",
        ],
        // `parallelServerBuildTraces` ist entfernt: Das Flag steht in der
        // mitgelieferten Next-Doku (node_modules/next/dist/docs) nirgends, ist
        // also nicht öffentlich unterstützt — und es parallelisiert
        // ausgerechnet die Erzeugung der Trace-Dateien. Es beschleunigt nur den
        // Build, der hier ohnehin in gut 20 Sekunden compiliert.
        parallelServerCompiles: true,
    },

    turbopack: {},

    async redirects() {
        return [
            { source: "/index.php", destination: "/", permanent: true },
            { source: "/index.html", destination: "/", permanent: true },
        ];
    },

    poweredByHeader: false,
    generateEtags: true,
    compress: true,
};

// 2. Verkettung: Wir jagen die Konfiguration erst durch next-intl und DANN durch den Analyzer
export default withAnalyzer(withNextIntl(nextConfig));