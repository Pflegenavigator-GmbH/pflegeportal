// src/app/page.tsx

import { redirect } from 'next/navigation';

import { defaultLocale } from '@/src/i18n/config';

// Absoluter Root leitet direkt auf die Standardsprache weiter
export default function RootPage() {
  redirect(`/${defaultLocale}`);
}
