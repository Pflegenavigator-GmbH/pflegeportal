import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const password = typeof body.password === 'string' ? body.password : '';

  const expectedPassword = process.env.PREVIEW_PASSWORD;

  if (!expectedPassword) {
    console.error('[preview-login] PREVIEW_PASSWORD ist nicht konfiguriert.');

    return NextResponse.json({ success: false }, { status: 500 });
  }

  if (password !== expectedPassword) {
    return NextResponse.json(
      {
        success: false,
        error: 'Das eingegebene Passwort ist nicht korrekt.',
      },
      { status: 401 }
    );
  }

  const response = NextResponse.json({
    success: true,
  });

  response.cookies.set({
    name: 'preview-access',
    value: 'allowed',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
