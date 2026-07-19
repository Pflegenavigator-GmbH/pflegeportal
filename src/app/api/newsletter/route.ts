// src/app/api/newsletter/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { isValidEmail } from '@/src/lib/api/validation';

interface NewsletterSignup {
  email: string;
  language: string;
  topics: string[];
  privacyAccepted: boolean;
  confirmationToken?: string;
  confirmed?: boolean;
}

const subscribers: NewsletterSignup[] = [];

export async function POST(request: NextRequest) {
  try {
    const data: NewsletterSignup = await request.json();

    // Längenlimit + lineares Muster — kein ReDoS-anfälliges Backtracking
    if (!data.email || typeof data.email !== 'string' || !isValidEmail(data.email)) {
      return NextResponse.json({ error: 'Ungueltige E-Mail-Adresse' }, { status: 400 });
    }

    if (!data.privacyAccepted) {
      return NextResponse.json({ error: 'Datenschutz muss akzeptiert werden' }, { status: 400 });
    }

    if (subscribers.some((s) => s.email.toLowerCase() === data.email.toLowerCase())) {
      return NextResponse.json({ error: 'Diese E-Mail ist bereits angemeldet' }, { status: 409 });
    }

    const subscriber = {
      email: data.email.toLowerCase(),
      language: data.language || 'de',
      topics: data.topics || [],
      privacyAccepted: data.privacyAccepted,
      subscribedAt: new Date().toISOString(),
      confirmed: false,
      confirmationToken: Math.random().toString(36).substring(2) + Date.now().toString(36),
    };

    subscribers.push(subscriber);

    return NextResponse.json({
      success: true,
      message: 'Bitte bestaetigen Sie Ihre E-Mail-Adresse',
      requiresConfirmation: true,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Fehler bei der Anmeldung' }, { status: 500 });
  }
}
