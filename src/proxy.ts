// src/proxy
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from "@/src/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
    return intlMiddleware(request);
}

export const config = {
    matcher: [
        // 🚀 KORREKTUR: "api" ist jetzt wieder im negativen Lookahead (?!api|...)
        // Damit greift die Middleware für /api/... überhaupt nicht mehr ein!
        '/((?!api|_next|assets|icons|screenshots|favicon.ico|manifest.json|sw.js|offline.html|vercel.svg|globe.svg|file.svg|window.svg|locales).*)',
        '/',
    ],
};