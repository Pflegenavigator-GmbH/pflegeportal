'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { Progress } from '@/src/components/ui/progress';
import { ArrowRight, ArrowLeft, Brain, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Frage, BewertungOption } from '@/src/types/pflegegrad';
import {KognitionForm} from "@/src/app/[locale]/pflegegrad/modul2/_components/KognitionsForm";

// Offizielle NBA-Kriterien für Modul 2 nach § 15 SGB XI
const KOGNITION_FRAGEN: Frage[] = [
  { id: "m2_1", text: "Personen aus dem näheren Umfeld erkennen", hilfe: "Werden Familienmitglieder oder Nachbarn zweifelsfrei identifiziert?" },
  { id: "m2_2", text: "Örtliche Orientierung", hilfe: "Findet sich die Person in der eigenen Wohnung oder der gewohnten Umgebung zurecht?" },
  { id: "m2_3", text: "Zeitliche Orientierung", hilfe: "Können Tageszeit, Wochentag und Jahreszeit korrekt benannt werden?" },
  { id: "m2_4", text: "Erinnern an wesentliche Ereignisse", hilfe: "Werden wichtige Erlebnisse oder Vereinbarungen (z.B. Arztbesuche) behalten?" },
  { id: "m2_5", text: "Steuerung von Alltagshandlungen", hilfe: "Können mehrschrittige Alltagsaktivitäten selbstständig geplant und umgesetzt werden?" }
];

// Die gesetzliche NBA-Punktematrix für kognitive Einschränkungen
const BEWERTUNG_OPTIONEN: BewertungOption[] = [
  { value: "0", label: "Keine Einschränkung (Selbstständig)", punkte: 0 },
  { value: "1", label: "Leichte Einschränkung (Größtenteils selbstständig)", punkte: 1 },
  { value: "2", label: "Mittlere Einschränkung (Größtenteils unselbstständig)", punkte: 2 },
  { value: "3", label: "Schwere Einschränkung (Unselbstständig)", punkte: 3 }
];

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function Modul2Page(props: PageProps) {
  const router = useRouter();
  const params = use(props.params);
  const locale = params?.locale || 'de';

  // ✅ FIX 1: Initialisiere den State direkt synchron, falls wir auf dem Client sind.
  // Das verhindert das synchrone Nachtragen innerhalb des Effects.
  const [caseCode, setCaseCode] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('case_code');
    }
    return null;
  });

  const [antworten, setAntworten] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!caseCode) {
      toast.error('Keine aktive Fall-Session gefunden. Bitte starten Sie neu.');
      router.push(`/${locale}/pflegegrad/start`);
      return;
    }

    // Vorhandene Antworten über deine GET-Schnittstelle laden
    fetch(`/api/cases/${caseCode.toUpperCase()}/answers`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error();
        })
        .then((data) => {
          const modul2Record = data.find((r: { module_number: number }) => r.module_number === 2);
          if (modul2Record?.answers) {
            setAntworten(modul2Record.answers as Record<string, string>);
          }
        })
        .catch(() => console.log("Keine alten Antworten für Modul 2 gefunden."));
  }, [caseCode, locale, router]);

  const handleAntwortChange = (frageId: string, wert: string) => {
    setAntworten(prev => ({ ...prev, [frageId]: wert }));
  };

  const handleWeiter = async () => {
    if (!caseCode) return;
    setLoading(true);

    // SGB-konforme Rohpunkte-Ermittlung
    let gesamtRohpunkte = 0;
    KOGNITION_FRAGEN.forEach(q => {
      const wert = antworten[q.id];
      const option = BEWERTUNG_OPTIONEN.find(o => o.value === wert);
      if (option) gesamtRohpunkte += option.punkte;
    });

    try {
      // Wir senden jede Frage einzeln an deine API-Route, um die answers-Struktur sauber zu synchronisieren
      for (const [questionKey, answerValue] of Object.entries(antworten)) {
        const response = await fetch(`/api/cases/${caseCode.toUpperCase()}/answers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moduleName: 'emr', // Mapped laut deiner Route auf module_number: 2
            questionKey,
            answerValue
          })
        });

        if (!response.ok) {
          throw new Error('Fehler beim Sichern einer Teilantwort.');
        }
      }

      // Rohpunkte für den späteren Abgleich mit Modul 3 im Speicher sichern
      localStorage.setItem("modul2_rohpunkte", gesamtRohpunkte.toString());

      toast.success('Modul 2 erfolgreich gespeichert.');
      router.push(`/${locale}/pflegegrad/modul3`);
    } catch (err) {
      console.error(err);
      toast.error('Fehler beim Übertragen der Daten an den Server.');
    } finally {
      setLoading(false);
    }
  };

  const fortschritt = (Object.keys(antworten).length / KOGNITION_FRAGEN.length) * 100;
  const alleBeantwortet = Object.keys(antworten).length === KOGNITION_FRAGEN.length;

  return (
      <div className="container mx-auto px-4 py-8 max-w-2xl text-white">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Modul 2: Kognition & Kommunikation</h1>
                <p className="text-sm text-gray-400">Gewichtung: 15% (Oder Modul 3, je nachdem was höher ist)</p>
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

        <KognitionForm
            fragen={KOGNITION_FRAGEN}
            optionen={BEWERTUNG_OPTIONEN}
            antworten={antworten}
            onAntwort={handleAntwortChange}
        />

        <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
          <Button
              variant="outline"
              onClick={() => router.push(`/${locale}/pflegegrad/start`)}
              className="border-white/10 text-white hover:bg-white/5 h-12 px-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <Button
              onClick={handleWeiter}
              disabled={!alleBeantwortet || loading}
              className="bg-[#20b2aa] hover:bg-[#3ddbd0] text-white font-bold h-12 px-6 shadow-lg disabled:opacity-40"
          >
            {loading ? 'Speichere...' : 'Weiter zu Modul 3'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex items-start gap-3 text-gray-400 text-xs leading-relaxed">
          <Shield className="w-5 h-5 flex-shrink-0 text-gray-500 mt-0.5" />
          <p>
            <strong>Wichtiger rechtlicher Hinweis:</strong> Die im Modul 2 erfassten Kriterien basieren auf den offiziellen Richtlinien des Medizinischen Dienstes (MD) zur Feststellung von Pflegebedürftigkeit nach dem SGB XI.
          </p>
        </div>
      </div>
  );
}