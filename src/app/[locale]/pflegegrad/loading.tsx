// src/app/[locale]/pflegegrad/loading.tsx
// Suspense-Fallback für den Pflegegrad-Workflow — ersetzt den bisherigen
// "hasMounted ? … : null"-Blank-Screen beim Navigieren zwischen Modulen.
//
// Bewusst eine Client Component: `loading.tsx` IST der Fallback der
// Suspense-Grenze. Ein Fallback darf nicht selbst suspendieren — mit einem
// `await getTranslations()` bleibt der Spinner dauerhaft stehen, weil React
// nichts mehr hat, was es anzeigen könnte. `useTranslations` liest dagegen
// synchron aus dem Provider des Locale-Layouts, das über dieser Grenze liegt.
'use client';

import { useTranslations } from 'next-intl';

export default function PflegegradLoading() {
  const t = useTranslations('common.zustaende');

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-white">
      <div className="w-10 h-10 border-4 border-white/10 border-t-[#20b2aa] rounded-full animate-spin" />
      <p className="mt-4 text-sm text-gray-400">{t('modulLaedt')}</p>
    </div>
  );
}
