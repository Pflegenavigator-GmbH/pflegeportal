// src/components/i18n/useLanguageChange.ts
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useLanguageChange() {
  const router = useRouter();
  const pathname = usePathname();

  const changeLanguage = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');

    toast.info(`Sprache zu ${newLocale.toUpperCase()} gewechselt`);
    router.push(newPath);
  };

  return { changeLanguage };
}
