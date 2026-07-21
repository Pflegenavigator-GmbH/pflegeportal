// src/hooks/useAssessmentModule.ts
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { logger } from '@/src/lib/logger';
import { AssessmentModuleName } from '@/src/lib/pflegegrad/assessment-modules';
import {
  loadModuleAnswers,
  saveModuleAnswers,
  SessionExpiredError,
} from '@/src/lib/pflegegrad/client-api';

interface UseAssessmentModuleArgs {
  moduleName: AssessmentModuleName;
  /** Schlüssel/IDs, die für Vollständigkeit und Fortschritt zählen */
  questionKeys: string[];
  /** Zielroute nach erfolgreichem Speichern (locale wird eingesetzt) */
  next: (locale: string) => string;
}

/**
 * Kapselt die in allen Modulseiten identische Logik: Session prüfen,
 * gespeicherte Antworten laden, Fortschritt/Vollständigkeit berechnen,
 * atomar speichern und weiternavigieren. Bei Fehler bleibt die Seite stehen
 * (keine Eingaben gehen verloren).
 */
export function useAssessmentModule({ moduleName, questionKeys, next }: UseAssessmentModuleArgs) {
  const router = useRouter();
  const { locale } = useParams();
  const localeStr = typeof locale === 'string' ? locale : 'de';

  const [hasMounted, setHasMounted] = useState(false);
  const [antworten, setAntworten] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [caseCode] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('case_code') : null
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);

    if (!caseCode) {
      toast.error('Keine aktive Fall-Session gefunden. Bitte starten Sie neu.');
      router.push(`/${localeStr}/pflegegrad/start`);
      return;
    }

    loadModuleAnswers(caseCode, moduleName)
      .then((gespeicherte) => {
        if (gespeicherte) setAntworten(gespeicherte);
      })
      .catch((err) => {
        if (err instanceof SessionExpiredError) {
          toast.error('Ihre Fall-Session ist abgelaufen. Bitte laden Sie Ihren Fall erneut.');
          router.push(`/${localeStr}/pflegegrad/start`);
          return;
        }
        logger.info(`Keine Vorab-Daten für ${moduleName} gefunden.`);
      });
  }, [caseCode, localeStr, router, moduleName]);

  const setAntwort = (key: string, wert: string) =>
    setAntworten((prev) => ({ ...prev, [key]: wert }));

  const alleBeantwortet = questionKeys.every(
    (k) => antworten[k] !== undefined && antworten[k] !== null && antworten[k] !== ''
  );
  const fortschritt = (questionKeys.filter((k) => antworten[k]).length / questionKeys.length) * 100;

  const speichernUndWeiter = async () => {
    if (!caseCode) return;
    setLoading(true);
    try {
      await saveModuleAnswers(caseCode, moduleName, antworten);
      toast.success('Fortschritt gespeichert.');
      router.push(next(localeStr));
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        toast.error('Ihre Fall-Session ist abgelaufen. Bitte laden Sie Ihren Fall erneut.');
        router.push(`/${localeStr}/pflegegrad/start`);
        return;
      }
      logger.error({ err }, `Fehler beim Speichern von ${moduleName}`);
      toast.error(
        'Speichern fehlgeschlagen. Ihre Eingaben bleiben erhalten — bitte erneut versuchen.'
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    locale: localeStr,
    hasMounted,
    caseCode,
    antworten,
    setAntwort,
    loading,
    alleBeantwortet,
    fortschritt,
    speichernUndWeiter,
  };
}
