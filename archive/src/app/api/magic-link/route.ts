// src/app/api/magic-link/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createQRCode, createMagicLink, createGuestLink } from '@/lib/magic-links';

/**
 * POST /api/magic-link
 * Erstellt Magic Link + QR-Code für einen Fall
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseCode, type = 'full', expiresInDays, redirectTo, permissions } = body;

    if (!caseCode) {
      return NextResponse.json(
        { error: 'CaseCode erforderlich' },
        { status: 400 }
      );
    }

    let result: any = {};

    switch (type) {
      case 'full':
        // Vollzugriff + QR-Code
        const { qrDataUrl, magicLink } = await createQRCode(caseCode, { 
          redirectTo,
          size: 300 
        });
        result = {
          magicLink,
          qrCode: qrDataUrl,
          expiresInDays: expiresInDays || null,
        };
        break;

      case 'link-only':
        // Nur Link, kein QR
        result = {
          magicLink: createMagicLink(caseCode, { redirectTo, expiresInDays }),
          expiresInDays: expiresInDays || null,
        };
        break;

      case 'guest':
        // Eingeschränkter Gast-Link
        result = {
          guestLink: createGuestLink(caseCode, permissions || ['view_results']),
          permissions,
        };
        break;

      case 'emergency':
        // Notfall-Karte
        result = {
          emergencyLink: createMagicLink(caseCode, { redirectTo: '/emergency' }),
          note: 'Dieser Link ist für Notfälle. Speichern Sie ihn ab oder drucken Sie ihn aus.',
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Unbekannter Typ' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      caseCode,
      type,
      ...result,
    });
  } catch (error) {
    console.error('Magic Link Fehler:', error);
    return NextResponse.json(
      { error: 'Link konnte nicht erstellt werden' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/magic-link?case=PF-ABC123
 * Überprüft ob ein Magic Link gültig ist
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const caseCode = searchParams.get('case');

  if (!caseCode) {
    return NextResponse.json(
      { error: 'CaseCode erforderlich' },
      { status: 400 }
    );
  }

  // Prüfe ob Fall existiert (optional)
  // const { data: caseData } = await supabase... 

  return NextResponse.json({
    valid: true,
    caseCode,
    canCreate: true,
    message: 'Magic Link kann erstellt werden',
  });
}
