import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

// 1. Initialisiere das next-intl Plugin mit dem Pfad zu deiner request-Datei
const withNextIntl = createNextIntlPlugin(
    './src/i18n/request.ts'
);

// Lazy load bundle analyzer only when ANALYZE is true
let withAnalyzer: (config: NextConfig) => NextConfig = (config) => config;

if (process.env.ANALYZE === "true") {
    const withBundleAnalyzer = require("@next/bundle-analyzer")({ enabled: true });
    withAnalyzer = withBundleAnalyzer;
}

// CSP-Konfiguration
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://analytics.umami.is;
  script-src-elem 'self' 'unsafe-inline' https://analytics.umami.is;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://*.supabase.co https://images.unsplash.com;
  font-src 'self';
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://analytics.umami.is;
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
    { key: "X-XSS-Protection", value: "1; mode=block" },
];

const nextConfig: NextConfig = {
    output: "standalone",

    images: {
        unoptimized: true,
        formats: ["image/webp", "image/avif"],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        minimumCacheTTL: 60,
        dangerouslyAllowSVG: true,
    },

    typescript: {
        ignoreBuildErrors: true, // Hilfreich während der Migration des Altcodes
    },

    async headers() {
        return [{ source: "/:path*", headers: securityHeaders }];
    },

    experimental: {
        optimizePackageImports: [
            "lucide-react",
            "@radix-ui/react-separator",
            "@supabase/supabase-js",
        ],
        parallelServerBuildTraces: true,
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