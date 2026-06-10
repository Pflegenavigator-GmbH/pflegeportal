'use client';

import { ArrowRight, ArrowLeft, Heart, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, use } from 'react';
import { toast } from 'sonner';

import { Button } from '@/src/components/ui/button';
import { Progress } from '@/src/components/ui/progress';
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

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function Modul3Page(props: PageProps) {
  const router = useRouter();
  const params = use(props.params);
  const locale = params?.locale || 'de';

  // Lazy State Initialization zur Vermeidung von synchronen Effects und Cascading Renders
  const [caseCode] = useState<string | null>(() => {
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

    // Abrufen bereits existierender Antworten über die /answers Route
    fetch(`/api/cases/${caseCode.toUpperCase()}/answers`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((data) => {
        // Modul 3 ausfindig machen (Je nach Zuordnung in deiner Route)
        const modul3Record = data.find((r: { module_number: number }) => r.module_number === 3);
        if (modul3Record?.answers) {
          setAntworten(modul3Record.answers as Record<string, string>);
        }
      })
      .catch(() => console.log('Keine alten Antworten für Modul 3 gefunden.'));
  }, [caseCode, locale, router]);

  const handleAntwortChange = (frageId: string, wert: string) => {
    setAntworten((prev) => ({ ...prev, [frageId]: wert }));
  };

  const handleWeiter = async () => {
    if (!caseCode) return;
    setLoading(true);

    // Summe der gesetzlichen Rohpunkte für Modul 3 ermitteln
    let gesamtRohpunkte = 0;
    VERHALTEN_FRAGEN.forEach((q) => {
      const wert = antworten[q.id];
      const option = BEWERTUNG_OPTIONEN.find((o) => o.value === wert);
      if (option) gesamtRohpunkte += option.punkte;
    });

    try {
      // Typsicheres Sichern über die POST-Route
      for (const [questionKey, answerValue] of Object.entries(antworten)) {
        const response = await fetch(`/api/cases/${caseCode.toUpperCase()}/answers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moduleName: 'gdb', // Nutzt das Mapping deiner Route für Modul-Nummer 3
            questionKey,
            answerValue,
          }),
        });

        if (!response.ok) {
          throw new Error('Sichern der verhaltensbezogenen Teilantwort fehlgeschlagen.');
        }
      }

      // Punkte für das spätere Fusing im Rechner ablegen
      localStorage.setItem('modul3_rohpunkte', gesamtRohpunkte.toString());

      toast.success('Modul 3 erfolgreich gespeichert.');
      router.push(`/${locale}/pflegegrad/modul4`);
    } catch (err: unknown) {
      console.error(err);
      toast.error('Fehler beim Übertragen der Daten an den Server.');
    } finally {
      setLoading(false);
    }
  };

  const fortschritt = (Object.keys(antworten).length / VERHALTEN_FRAGEN.length) * 100;
  const alleBeantwortet = Object.keys(antworten).length === VERHALTEN_FRAGEN.length;

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
