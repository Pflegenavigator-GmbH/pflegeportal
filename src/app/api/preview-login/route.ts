// src/app/api/preview-login/route.ts

import { NextRequest, NextResponse } from 'next/server';

import {
  createPreviewToken,
  PREVIEW_COOKIE_NAME,
  PREVIEW_SESSION_MAX_AGE,
} from '@/src/lib/preview/preview-auth';

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Ungültige Anfrage.',
      },
      {
        status: 400,
      }
    );
  }

  const password =
    typeof body === 'object' &&
    body !== null &&
    'password' in body &&
    typeof body.password === 'string'
      ? body.password
      : '';

  const expectedPassword = process.env.PREVIEW_PASSWORD;
  const tokenSecret = process.env.PREVIEW_TOKEN_SECRET;

  if (!expectedPassword || !tokenSecret) {
    console.error('[preview-login] Preview-Konfiguration unvollständig.');

    return NextResponse.json(
      {
        success: false,
        error: 'Die Vorschau ist derzeit nicht verfügbar.',
      },
      {
        status: 500,
      }
    );
  }

  if (password !== expectedPassword) {
    return NextResponse.json(
      {
        success: false,
        error: 'Das eingegebene Passwort ist nicht korrekt.',
      },
      {
        status: 401,
      }
    );
  }

  const token = await createPreviewToken(tokenSecret);

  const response = NextResponse.json({
    success: true,
  });

  response.cookies.set({
    name: PREVIEW_COOKIE_NAME,
    value: token,

    // JavaScript im Browser kann den Token nicht auslesen.
    httpOnly: true,

    // Lokal über HTTP erlaubt, in Produktion ausschließlich HTTPS.
    secure: process.env.NODE_ENV === 'production',

    // Schutz gegen unnötige Cross-Site-Übertragung.
    sameSite: 'lax',

    // Gilt für die komplette Website.
    path: '/',

    // Nach 45 Minuten löscht der Browser das Cookie.
    maxAge: PREVIEW_SESSION_MAX_AGE,
  });

  return response;
}
