// src/lib/env.ts
// Zentrale Auflösung der öffentlichen Basis-URL.
// Historisch existierten NEXT_PUBLIC_URL (Checkout) und NEXT_PUBLIC_APP_URL
// (Mailversand) parallel — hier ist die einzige Stelle, die beide kennt.
const FALLBACK_BASE_URL = 'https://pflegenavigatoreu.com';

export function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL || FALLBACK_BASE_URL;
  return raw.replace(/\/+$/, '');
}
