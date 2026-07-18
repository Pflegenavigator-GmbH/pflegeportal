// src/app/[locale]/pflegegrad/modul3/page.tsx
'use client';

import { ArrowRight, ArrowLeft, Heart, Shield } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { Button } from '@/src/components/ui/button';
import { Progress } from '@/src/components/ui/progress';
import { logger } from '@/src/lib/logger';
import {
  loadModuleAnswers,
  saveModuleAnswers,
  SessionExpiredError,
} from '@/src/lib/pflegegrad/client-api';
import { Frage, BewertungOption } from '@/src/types/pflegegrad';

import { VerhaltenForm } from './_components/VerhaltenForm';

// Offizielle NBA-Kriterien für Modul 3 nach § 15 SGB XI
const VERHALTEN_FRAGEN: Frage[] = [
  {
    id: 'm3_1',
    text: 'Motorisch geprägte Verhaltensweisen',
    hilfe: 'Z.B. zielloses Herumlaufen, Aufstehen und Niedersetzen, Weglauf-Tendenzen.',
  },
  {
    id: 'm3_2',
    text: 'Nächtliche Unruhe',
    hilfe: 'Wird der Tag-Nacht-Rhythmus gestört? Gibt es nächtliches Umherwandern oder Rufen?',
  },
  {
    id: 'm3_3',
    text: 'Selbstschädigendes und autoaggressives Verhalten',
    hilfe: 'Z.B. Kratzen, Schlagen gegen Gegenstände, Verweigerung von Nahrung/Flüssigkeit.',
  },
  {
    id: 'm3_4',
    text: 'Abwehr von pflegerischen Maßnahmen',
    hilfe: 'Gibt es verbalen oder physischen Widerstand bei der Körperpflege oder beim Ankleiden?',
  },
];

// Offizielle gesetzliche NBA-Bewertungsskala für Verhaltensweisen (§ 15 SGB XI)
const BEWERTUNG_OPTIONEN: BewertungOption[] = [
  { value: '0', label: 'Nie oder sehr selten', punkte: 0 },
  { value: '1', label: 'Selten (ein- bis mehrmals wöchentlich)', punkte: 1 },
  { value: '3', label: 'Häufig (täglich oder mehrfach täglich)', punkte: 3 },
];

export default function Modul3Page() {
  const router = useRouter();
  const { locale } = useParams();

  const [caseCode] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('case_code');
    }
    return null;
  });

  const [antworten, setAntworten] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);

    if (!caseCode) {
      toast.error('Keine aktive Fall-Session gefunden. Bitte starten Sie neu.');
      router.push(`/${locale}/pflegegrad/start`);
      return;
    }

    loadModuleAnswers(caseCode, 'modul3')
      .then((answers) => {
        if (answers) {
          setAntworten(answers);
          logger.debug({ caseCode }, 'Bestehende Antworten für Modul 3 geladen.');
        }
      })
      .catch((err) => {
        if (err instanceof SessionExpiredError) {
          toast.error('Ihre Fall-Session ist abgelaufen. Bitte laden Sie Ihren Fall erneut.');
          router.push(`/${locale}/pflegegrad/start`);
          return;
        }
        logger.info('Keine alten Antworten für Modul 3 gefunden.');
      });
  }, [caseCode, locale, router]);

  const handleAntwortChange = (frageId: string, wert: string) => {
    setAntworten((prev) => ({ ...prev, [frageId]: wert }));
  };

  const handleWeiter = async () => {
    if (!caseCode) return;
    setLoading(true);

    let gesamtRohpunkte = 0;
    VERHALTEN_FRAGEN.forEach((q) => {
      const wert = antworten[q.id];
      const option = BEWERTUNG_OPTIONEN.find((o) => o.value === wert);
      if (option) gesamtRohpunkte += option.punkte;
    });

    try {
      await saveModuleAnswers(caseCode, 'modul3', antworten);

      localStorage.setItem('modul3_rohpunkte', gesamtRohpunkte.toString());
      toast.success('Modul 3 erfolgreich gespeichert.');
      router.push(`/${locale}/pflegegrad/modul4`);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        toast.error('Ihre Fall-Session ist abgelaufen. Bitte laden Sie Ihren Fall erneut.');
        router.push(`/${locale}/pflegegrad/start`);
        return;
      }
      logger.error({ err }, 'Fehler beim Sichern von Modul 3');
      toast.error(
        'Speichern fehlgeschlagen. Ihre Eingaben bleiben erhalten — bitte erneut versuchen.'
      );
    } finally {
      setLoading(false);
    }
  };

  // 🛡️ Inhaltlich präzise Validierung gegen Geister-Daten
  const alleBeantwortet = VERHALTEN_FRAGEN.every(
    (f) => antworten[f.id] !== undefined && antworten[f.id] !== null && antworten[f.id] !== ''
  );

  const fortschritt =
    (VERHALTEN_FRAGEN.filter((f) => antworten[f.id]).length / VERHALTEN_FRAGEN.length) * 100;

  if (!hasMounted) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl text-white">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-500/20 rounded-lg border border-pink-500/30">
              <Heart className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Modul 3: Verhaltensweisen & Psyche</h1>
              <p className="text-sm text-gray-400">
                Gewichtung: 15% (Vergleichs-Fusing mit Modul 2)
              </p>
            </div>
          </div>
          {caseCode && (
            <span className="text-xs font-mono bg-white/5 border border-white/10 px-3 py-1 rounded-full text-gray-400">
              ID: {caseCode}
            </span>
          )}
        </div>

        <Progress value={fortschritt} className="w-full h-2 bg-white/5" />
      </div>

      <VerhaltenForm
        fragen={VERHALTEN_FRAGEN}
        optionen={BEWERTUNG_OPTIONEN}
        antworten={antworten}
        onAntwort={handleAntwortChange}
      />

      <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
        <Button
          variant="outline"
          disabled={loading}
          onClick={() => router.push(`/${locale}/pflegegrad/modul2`)}
          className="border-white/10 text-white hover:bg-white/5 h-12 px-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zu Modul 2
        </Button>
        <Button
          onClick={handleWeiter}
          disabled={!alleBeantwortet || loading}
          className="bg-[#20b2aa] hover:bg-[#3ddbd0] text-white font-bold h-12 px-6 shadow-lg disabled:opacity-40"
        >
          {loading ? 'Speichere...' : 'Weiter zu Modul 4'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="mt-8 pt-6 border-t border-white/10 flex items-start gap-3 text-gray-400 text-xs leading-relaxed">
        <Shield className="w-5 h-5 flex-shrink-0 text-gray-500 mt-0.5" />
        <p>
          <strong>Wichtiger rechtlicher Hinweis:</strong> Die im Modul 3 erfassten Kriterien
          spiegeln psychische Problemlagen wider. Sie fließen über das Höchstwert-Prinzip direkt in
          die Ermittlung des Pflegegrads ein.
        </p>
      </div>
    </div>
  );
}
