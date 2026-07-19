// src/app/[locale]/pflegegrad/modul1/page.tsx
'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Accessibility } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Label } from '@/src/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group';
import { logger } from '@/src/lib/logger';
import {
  loadModuleAnswers,
  saveModuleAnswers,
  SessionExpiredError,
} from '@/src/lib/pflegegrad/client-api';
import { FRAGEN_MODUL_1, BEWERTUNGEN } from '@/src/lib/pflegegrad/fragen';

export default function Modul1Page() {
  const router = useRouter();
  const { locale } = useParams();
  const [antworten, setAntworten] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  const caseCode = typeof window !== 'undefined' ? localStorage.getItem('case_code') : null;

  // 📥 Bereits gespeicherte Antworten beim Laden der Seite rekonstruieren
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);

    if (!caseCode) {
      toast.error('Keine aktive Fall-Session gefunden.');
      router.push(`/${locale}/pflegegrad/start`);
      return;
    }

    loadModuleAnswers(caseCode, 'modul1')
      .then((answers) => {
        if (answers) {
          setAntworten(answers);
          logger.debug({ caseCode }, 'Bestehende Antworten für Modul 1 rekonstruiert.');
        }
      })
      .catch((err) => {
        if (err instanceof SessionExpiredError) {
          toast.error('Ihre Fall-Session ist abgelaufen. Bitte laden Sie Ihren Fall erneut.');
          router.push(`/${locale}/pflegegrad/start`);
          return;
        }
        logger.info('Keine Vorab-Daten für Modul 1 in der DB gefunden.');
      });
  }, [caseCode, locale, router]);

  const handleAntwort = (frageId: string, wert: string) => {
    setAntworten((prev) => ({ ...prev, [frageId]: wert }));
  };

  const handleWeiter = async () => {
    if (!caseCode) return;
    setLoading(true);

    // 1. Rohpunkte für den lokalen schnellen Cache aufsummieren
    let rohPunkte = 0;
    Object.values(antworten).forEach((wert) => {
      const option = BEWERTUNGEN.find((b) => b.value === wert);
      if (option) rohPunkte += option.punkte;
    });

    // 2. Ein atomarer Bulk-Save — bei Fehler bleibt die Seite erhalten
    try {
      await saveModuleAnswers(caseCode, 'modul1', antworten);

      localStorage.setItem('modul1_rohpunkte', rohPunkte.toString());
      toast.success('Fortschritt online gespeichert!');
      router.push(`/${locale}/pflegegrad/modul2`);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        toast.error('Ihre Fall-Session ist abgelaufen. Bitte laden Sie Ihren Fall erneut.');
        router.push(`/${locale}/pflegegrad/start`);
        return;
      }
      logger.error({ err }, 'Fehler bei der API-Synchronisierung von Modul 1');
      toast.error(
        'Speichern fehlgeschlagen. Ihre Eingaben bleiben erhalten — bitte erneut versuchen.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Gesetzlich saubere Validierung: Jede Frage muss eine zugewiesene Antwort haben
  const alleBeantwortet = FRAGEN_MODUL_1.every(
    (f) => antworten[f.id] !== undefined && antworten[f.id] !== null && antworten[f.id] !== ''
  );

  const fortschritt =
    (FRAGEN_MODUL_1.filter((f) => antworten[f.id]).length / FRAGEN_MODUL_1.length) * 100;

  if (!hasMounted) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl text-white">
      {/* Modul-Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600/20 rounded-xl border border-emerald-500/30">
              <Accessibility className="w-6 h-6 text-[#20b2aa]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Modul 1: Mobilität</h1>
              <p className="text-sm text-gray-400">Gewichtung im Gesamtverfahren: 10%</p>
            </div>
          </div>
          {caseCode && (
            <span className="text-xs font-mono bg-white/5 border border-white/10 px-3 py-1 rounded-full text-gray-400">
              ID: {caseCode}
            </span>
          )}
        </div>

        {/* Fortschrittsbalken */}
        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#20b2aa] h-full transition-all duration-300"
            style={{ width: `${fortschritt}%` }}
          />
        </div>
      </div>

      {/* Fragen-Liste */}
      <div className="space-y-6">
        {FRAGEN_MODUL_1.map((frage, index) => (
          <motion.div
            key={frage.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="bg-white/5 border-white/10 text-white">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-1">{frage.text}</h3>
                <p className="text-sm text-gray-400 mb-4">{frage.hilfe}</p>

                <RadioGroup
                  value={antworten[frage.id] || ''}
                  onValueChange={(wert) => handleAntwort(frage.id, wert)}
                  className="grid sm:grid-cols-2 gap-3"
                >
                  {BEWERTUNGEN.map((b) => (
                    <div
                      key={b.value}
                      onClick={() => handleAntwort(frage.id, b.value)}
                      className={`flex items-center space-x-2 p-3 rounded-lg border transition-all cursor-pointer ${
                        antworten[frage.id] === b.value
                          ? 'border-[#20b2aa] bg-[#20b2aa]/10'
                          : 'border-white/10 hover:bg-white/5'
                      }`}
                    >
                      <RadioGroupItem
                        value={b.value}
                        id={`${frage.id}-${b.value}`}
                        className="border-white text-[#20b2aa]"
                      />
                      <Label
                        htmlFor={`${frage.id}-${b.value}`}
                        className="cursor-pointer text-sm font-medium w-full select-none"
                      >
                        {b.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Navigations-Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          disabled={loading}
          onClick={() => router.push(`/${locale}/pflegegrad/start`)}
          className="border-white/10 text-white hover:bg-white/5"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Zurück zum Start
        </Button>

        <Button
          onClick={handleWeiter}
          disabled={!alleBeantwortet || loading}
          className="bg-[#20b2aa] hover:bg-[#3ddbd0] text-white font-bold disabled:opacity-40"
        >
          {loading ? 'Speichere...' : 'Weiter zu Modul 2'} <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
