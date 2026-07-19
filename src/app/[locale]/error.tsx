// src/app/[locale]/error.tsx
// Lokalisierte Error-Boundary für alle Seiten unterhalb des Locale-Layouts.
// Header/Footer des Layouts bleiben erhalten — nur der Seiteninhalt fällt aus.
'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/src/components/ui/button';
import { logger } from '@/src/lib/logger';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error({ error: error.message, digest: error.digest }, 'Client-Error-Boundary ausgelöst');
  }, [error]);

  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-white text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-500/10 border border-rose-500/30 rounded-full mb-6">
        <AlertTriangle className="w-10 h-10 text-rose-400" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Es ist ein Fehler aufgetreten</h1>
      <p className="text-gray-400 max-w-md leading-relaxed">
        Bitte versuchen Sie es erneut. Ihre gespeicherten Falldaten sind davon nicht betroffen.
      </p>
      {error.digest && <p className="text-gray-600 text-xs mt-2">Fehlercode: {error.digest}</p>}
      <Button
        onClick={reset}
        className="mt-6 bg-[#20b2aa] hover:bg-[#3ddbd0] text-slate-950 font-bold"
      >
        <RefreshCw className="w-4 h-4 mr-2" /> Erneut versuchen
      </Button>
    </main>
  );
}
