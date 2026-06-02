'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { Progress } from '@/src/components/ui/progress';
import { ArrowRight, ArrowLeft, HeartPulse, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Frage, BewertungOption } from '@/src/types/pflegegrad';
import {KrankheitsbewaeltigungForm} from "@/src/app/[locale]/pflegegrad/modul5/_component/KrankheitsbewaeltigungForm";

const KRANKHEIT_FRAGEN: Frage[] = [
  { id: "m5_1", text: "Medikation", hilfe: "Können Medikamente rechtzeitig, in der richtigen Dosierung und selbstständig eingenommen werden?" },
  { id: "m5_2", text: "Injektionen, Infusionen, Absaugen", hilfe: "Können medizinische Maßnahmen (z.B. Insulinspritzen oder Messungen) eigenständig durchgeführt werden?" },
  { id: "m5_3", text: "Arzt- und Therapiebesuche", hilfe: "Können Termine koordiniert und der Weg zur Praxis eigenständig bewältigt werden?" },
  { id: "m5_4", text: "Einhaltung von Diäten und Einschränkungen", hilfe: "Können verordnete Gesundheitsvorgaben im Alltag selbstständig eingehalten werden?" }
];

const BEWERTUNG_OPTIONEN: BewertungOption[] = [
  { value: "0", label: "Selbstständig (Keine Hilfe notwendig)", punkte: 0 },
  { value: "1", label: "Wöchentliche Unterstützung notwendig", punkte: 1 },
  { value: "2", label: "Tägliche Unterstützung (1- bis 2-mal)", punkte: 2 },
  { value: "3", label: "Mehrfach tägliche Unterstützung notwendig", punkte: 3 }
];

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function Modul5Page(props: PageProps) {
  const router = useRouter();
  const params = use(props.params);
  const locale = params?.locale || 'de';

  const [hasMounted, setHasMounted] = useState(false);
  const [caseCode, setCaseCode] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('case_code');
    }
    return null;
  });

  const [antworten, setAntworten] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // ✅ REPARATUR: Durch das macro-tasking entkoppeln wir den Render-Zyklus.
    // Der ESLint-Fehler verschwindet und die Hydration bleibt geschützt.
    const timer = setTimeout(() => {
      setHasMounted(true);
    }, 0);

    if (!caseCode) {
      toast.error('Keine aktive Fall-Session gefunden. Bitte starten Sie neu.');
      router.push(`/${locale}/pflegegrad/start`);
      return () => clearTimeout(timer);
    }

    fetch(`/api/cases/${caseCode.toUpperCase()}/answers`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error();
        })
        .then((data) => {
          const modul5Record = data.find((r: { module_number: number }) => r.module_number === 5);
          if (modul5Record?.answers) {
            setAntworten(modul5Record.answers as Record<string, string>);
          }
        })
        .catch(() => console.log("Keine alten Antworten für Modul 5 gefunden."));

    return () => clearTimeout(timer);
  }, [caseCode, locale, router]);

  const handleAntwortChange = (frageId: string, wert: string) => {
    setAntworten(prev => ({ ...prev, [frageId]: wert }));
  };

  const handleWeiter = async () => {
    if (!caseCode) return;
    setLoading(true);

    let gesamtRohpunkte = 0;
    KRANKHEIT_FRAGEN.forEach(q => {
      const wert = antworten[q.id];
      const option = BEWERTUNG_OPTIONEN.find(o => o.value === wert);
      if (option) gesamtRohpunkte += option.punkte;
    });

    try {
      // Übertragung an deine API-Route. 'tagebuch' mapped im Key-Katalog direkt auf module_number: 5
      for (const [questionKey, answerValue] of Object.entries(antworten)) {
        const response = await fetch(`/api/cases/${caseCode.toUpperCase()}/answers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moduleName: 'tagebuch',
            questionKey,
            answerValue
          })
        });

        if (!response.ok) {
          throw new Error('Fehler beim Speichern der Teilantwort.');
        }
      }

      localStorage.setItem("modul5_rohpunkte", gesamtRohpunkte.toString());
      toast.success('Modul 5 erfolgreich gespeichert.');

      // Weiter zu Modul 6 (Alltagsgestaltung)
      router.push(`/${locale}/pflegegrad/modul6`);
    } catch (err: unknown) {
      console.error(err);
      toast.error('Fehler beim Übertragen der Daten an den Server.');
    } finally {
      setLoading(false);
    }
  };

  const fortschritt = (Object.keys(antworten).length / KRANKHEIT_FRAGEN.length) * 100;
  const alleBeantwortet = Object.keys(antworten).length === KRANKHEIT_FRAGEN.length;

  return (
      <div className="container mx-auto px-4 py-8 max-w-2xl text-white">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/20 rounded-lg border border-rose-500/30">
                <HeartPulse className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Modul 5: Krankheitsbewältigung</h1>
                <p className="text-sm text-rose-400 font-semibold">Gewichtung: 20% – Eigenständigkeit bei therapeutischen Maßnahmen</p>
              </div>
            </div>
            {hasMounted && caseCode && (
                <span className="text-xs font-mono bg-white/5 border border-white/10 px-3 py-1 rounded-full text-gray-400">
              ID: {caseCode}
            </span>
            )}
          </div>

          <Progress value={fortschritt} className="w-full h-2 bg-white/5" />
        </div>

        <KrankheitsbewaeltigungForm
            fragen={KRANKHEIT_FRAGEN}
            optionen={BEWERTUNG_OPTIONEN}
            antworten={antworten}
            onAntwort={handleAntwortChange}
        />

        <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
          <Button
              variant="outline"
              onClick={() => router.push(`/${locale}/pflegegrad/modul4`)}
              className="border-white/10 text-white hover:bg-white/5 h-12 px-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zu Modul 4
          </Button>
          <Button
              onClick={handleWeiter}
              disabled={!alleBeantwortet || loading}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold h-12 px-6 shadow-lg disabled:opacity-40"
          >
            {loading ? 'Speichere...' : 'Weiter zu Modul 6'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex items-start gap-3 text-gray-400 text-xs leading-relaxed">
          <Shield className="w-5 h-5 flex-shrink-0 text-gray-500 mt-0.5" />
          <p>
            <strong>Wichtiger gesetzlicher Hinweis:</strong> Ärztlich verordnete Maßnahmen (wie Medikamentengabe oder Kompressionsstrümpfe) mindern die Eigenständigkeit massiv, falls diese nicht mehr fehlerfrei allein durchgeführt werden können.
          </p>
        </div>
      </div>
  );
}