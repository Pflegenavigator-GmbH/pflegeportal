// src/app/[locale]/pflegegrad/modul4/page.tsx
'use client';

import { ArrowRight, ArrowLeft, Sparkles, Shield } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { SelbstversorgungForm } from '@/src/app/[locale]/pflegegrad/modul4/_component/SelbstversorgungForm';
import { Button } from '@/src/components/ui/button';
import { Progress } from '@/src/components/ui/progress';
import { logger } from '@/src/lib/logger';
import { Frage, BewertungOption } from '@/src/types/pflegegrad';

const SELBSTVERSORGUNG_FRAGEN: Frage[] = [
  {
    id: 'm4_1',
    text: 'Waschen des Oberkörpers und Intimbereichs',
    hilfe: 'Können Sie sich am Waschbecken oder in der Dusche selbstständig reinigen?',
  },
  {
    id: 'm4_2',
    text: 'Zähneputzen, Kämmen, Rasieren',
    hilfe: 'Können Sie die tägliche Mund- und Haarpflege eigenständig durchführen?',
  },
  {
    id: 'm4_3',
    text: 'Mundgerechtes Zubereiten & Aufnehmen von Speisen',
    hilfe: 'Können Sie Brot schneiden, Nahrung zum Mund führen, kauen und schlucken?',
  },
  {
    id: 'm4_4',
    text: 'Nutzen einer Toilette oder eines Toilettenstuhls',
    hilfe: 'Können Sie sich hinsetzen, aufstehen, die Kleidung richten und sich säubern?',
  },
  {
    id: 'm4_5',
    text: 'An- und Auskleiden des Oberkörpers',
    hilfe: 'Können Sie Hemden, Pullover oder Unterwäsche selbstständig an- und ablegen?',
  },
  {
    id: 'm4_6',
    text: 'An- und Auskleiden des Unterkörpers',
    hilfe: 'Können Sie Hosen, Socken und Schuhe ohne fremde Hilfe anziehen?',
  },
];

const BEWERTUNG_OPTIONEN: BewertungOption[] = [
  { value: '0', label: 'Selbstständig (Keine Einschränkung)', punkte: 0 },
  { value: '1', label: 'Überwiegend selbstständig (Leichte Einschränkung)', punkte: 1 },
  { value: '2', label: 'Überwiegend unselbstständig (Mittlere Einschränkung)', punkte: 2 },
  { value: '3', label: 'Unselbstständig (Vollständig hilfsbedürftig)', punkte: 3 },
];

export default function Modul4Page() {
  const router = useRouter();
  const { locale } = useParams();
  const [hasMounted, setHasMounted] = useState(false);
  const [antworten, setAntworten] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const caseCode = typeof window !== 'undefined' ? localStorage.getItem('case_code') : null;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);

    if (!caseCode) {
      toast.error('Keine aktive Fall-Session gefunden. Bitte starten Sie neu.');
      router.push(`/${locale}/pflegegrad/start`);
      return;
    }

    fetch(`/api/cases/${caseCode.toUpperCase()}/answers`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((data) => {
        const modul4Record = data.find((r: { module_number: number }) => r.module_number === 4);
        if (modul4Record?.answers) {
          setAntworten(modul4Record.answers as Record<string, string>);
          logger.debug({ caseCode }, 'Bestehende Antworten für Modul 4 geladen.');
        }
      })
      .catch(() => logger.info('Keine alten Antworten für Modul 4 gefunden.'));
  }, [caseCode, locale, router]);

  const handleAntwortChange = (frageId: string, wert: string) => {
    setAntworten((prev) => ({ ...prev, [frageId]: wert }));
  };

  const handleWeiter = async () => {
    if (!caseCode) return;
    setLoading(true);

    let gesamtRohpunkte = 0;
    SELBSTVERSORGUNG_FRAGEN.forEach((q) => {
      const wert = antworten[q.id];
      const option = BEWERTUNG_OPTIONEN.find((o) => o.value === wert);
      if (option) gesamtRohpunkte += option.punkte;
    });

    try {
      // 🚀 Umstellung auf parallele Requests mittels Promise.all für atomares Sichern
      await Promise.all(
        Object.entries(antworten).map(([questionKey, answerValue]) =>
          fetch(`/api/cases/${caseCode.toUpperCase()}/answers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              moduleName: 'sgb14', // Mapped laut Server-Route auf module_number: 4
              questionKey,
              answerValue,
            }),
          }).then((res) => {
            if (!res.ok) throw new Error('Fehler beim Sichern einer Teilantwort.');
          })
        )
      );

      localStorage.setItem('modul4_rohpunkte', gesamtRohpunkte.toString());
      toast.success('Modul 4 erfolgreich gespeichert.');
      router.push(`/${locale}/pflegegrad/modul5`);
    } catch (err) {
      logger.error({ err }, 'Fehler beim API-Transit in Modul 4');
      toast.error('Fehler beim Übertragen der Daten an den Server.');
      // Lokales Weitergehen trotz Netzwerk-Schluckauf gestatten
      router.push(`/${locale}/pflegegrad/modul5`);
    } finally {
      setLoading(false);
    }
  };

  // 🛡️ Inhaltlich präzise Validierung
  const alleBeantwortet = SELBSTVERSORGUNG_FRAGEN.every(
    (f) => antworten[f.id] !== undefined && antworten[f.id] !== null && antworten[f.id] !== ''
  );

  const fortschritt =
    (SELBSTVERSORGUNG_FRAGEN.filter((f) => antworten[f.id]).length /
      SELBSTVERSORGUNG_FRAGEN.length) *
    100;

  if (!hasMounted) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl text-white">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
              <Sparkles className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Modul 4: Selbstversorgung</h1>
              <p className="text-sm text-emerald-400 font-semibold">
                Gewichtung: 40% – Die wichtigste Kategorie im NBA-Verfahren!
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

      <SelbstversorgungForm
        fragen={SELBSTVERSORGUNG_FRAGEN}
        optionen={BEWERTUNG_OPTIONEN}
        antworten={antworten}
        onAntwort={handleAntwortChange}
      />

      <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
        <Button
          variant="outline"
          disabled={loading}
          onClick={() => router.push(`/${locale}/pflegegrad/modul3`)}
          className="border-white/10 text-white hover:bg-white/5 h-12 px-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zu Modul 3
        </Button>
        <Button
          onClick={handleWeiter}
          disabled={!alleBeantwortet || loading}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 px-6 shadow-lg disabled:opacity-40"
        >
          {loading ? 'Speichere...' : 'Weiter zu Modul 5'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="mt-8 pt-6 border-t border-white/10 flex items-start gap-3 text-gray-400 text-xs leading-relaxed">
        <Shield className="w-5 h-5 flex-shrink-0 text-gray-500 mt-0.5" />
        <p>
          <strong>Wichtiger gesetzlicher Hinweis:</strong> Die Selbstversorgung bildet das Fundament
          der Pflegeeinstufung. Fehlerhafte Angaben in diesem Modul führen in der Praxis zu über 80
          % aller fehlerhaften Bescheide durch die Pflegekassen.
        </p>
      </div>
    </div>
  );
}
