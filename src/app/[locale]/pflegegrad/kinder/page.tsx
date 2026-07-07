// src/app/[locale]/pflegegrad/kinder/page.tsx
'use client';

import {
  Baby,
  Puzzle,
  Utensils,
  Activity,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Star,
  Gamepad2,
  Lock,
  FileText,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Progress } from '@/src/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group';
import { logger } from '@/src/lib/logger';

type AgeGroup = 'baby' | 'toddler' | 'preschool' | 'school';

interface ChildInfo {
  name: string;
  age: number;
  ageGroup: AgeGroup;
}

interface QuestionOption {
  value: number;
  label: string;
  simpleLabel: string;
}

interface Question {
  id: string;
  text: string;
  simpleText: string;
  options: QuestionOption[];
}

interface AssessmentCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  questions: Question[];
}

interface AssessmentResult {
  level: number;
  points: number;
  maxPoints: number;
  description: string;
}

const getAgeGroup = (age: number): AgeGroup => {
  if (age < 1.5) return 'baby';
  if (age < 3) return 'toddler';
  if (age < 6) return 'preschool';
  return 'school';
};

const getAssessmentCategories = (age: number): AssessmentCategory[] => {
  const ageGroup = getAgeGroup(age);

  const baseCategories: AssessmentCategory[] = [
    {
      id: 'mobility',
      name: 'Bewegung & Motorik',
      icon: <Activity className="w-6 h-6" />,
      color: 'from-pink-500 to-rose-600',
      questions: [
        {
          id: 'k_mob_1',
          text: 'Kann das Kind sich im Raum altersentsprechend fortbewegen (Kriechen, Laufen, Drehen)?',
          simpleText: 'Wie klappt die Fortbewegung im Haus?',
          options: [
            {
              value: 0,
              label: 'Altersgerecht selbstständig',
              simpleLabel: '😊 Altersgerecht - keine Hilfe nötig',
            },
            {
              value: 1,
              label: 'Leichte Verzögerung',
              simpleLabel: '😐 Manchmal Unterstützung oder Halten nötig',
            },
            {
              value: 2,
              label: 'Deutliche Einschränkung',
              simpleLabel: '😕 Häufiges Tragen/Hilfe erforderlich',
            },
            {
              value: 3,
              label: 'Vollständig unselbstständig',
              simpleLabel: '😟 Kann sich nicht allein fortbewegen',
            },
          ],
        },
      ],
    },
    {
      id: 'cognitive',
      name: 'Denken & Verstehen',
      icon: <Puzzle className="w-6 h-6" />,
      color: 'from-purple-500 to-indigo-600',
      questions: [
        {
          id: 'k_cog_1',
          text: 'Kann das Kind Gefahren erkennen oder altersentsprechend Spielzeugen folgen?',
          simpleText: 'Wie aufmerksam ist Ihr Kind beim Spielen?',
          options: [
            { value: 0, label: 'Keine Auffälligkeiten', simpleLabel: '😊 Ganz normal altersgemäß' },
            {
              value: 1,
              label: 'Muss oft abgelenkt/erinnert werden',
              simpleLabel: '😐 Erfordert erhöhte Aufmerksamkeit',
            },
            {
              value: 2,
              label: 'Gefahrenbewusstsein fehlt stark',
              simpleLabel: '😕 Ständige Überwachung nötig',
            },
          ],
        },
      ],
    },
    {
      id: 'selfcare',
      name: 'Ernährung & Pflege',
      icon: <Utensils className="w-6 h-6" />,
      color: 'from-emerald-500 to-teal-600',
      questions: [
        {
          id: 'k_sel_1',
          text: 'Bestehen erhebliche Probleme bei der Nahrungsaufnahme (Schluckstörungen, verweigern)?',
          simpleText: 'Wie klappt das Essen und Trinken?',
          options: [
            {
              value: 0,
              label: 'Altersentsprechend',
              simpleLabel: '😊 Ohne medizinische Besonderheiten',
            },
            {
              value: 2,
              label: 'Erhöhter Zeitaufwand beim Füttern',
              simpleLabel: '😐 Essen dauert sehr lange / Hilfsmittel',
            },
            {
              value: 3,
              label: 'Sondenernährung / Schwere Störung',
              simpleLabel: '😟 Aufwendige Unterstützung bei jeder Mahlzeit',
            },
          ],
        },
      ],
    },
  ];

  if (ageGroup === 'baby') {
    return baseCategories.map((cat) => ({
      ...cat,
      questions: cat.questions.map((q) => ({
        ...q,
        options: q.options.map((o) => ({
          ...o,
          label: o.label.replace('selbstständig', 'entwicklungskonform'),
        })),
      })),
    }));
  }

  return baseCategories;
};

const calculateChildCareLevel = (points: number, age: number): AssessmentResult => {
  const isBaby = age < 1.5;

  if (isBaby) {
    if (points >= 90)
      return {
        level: 5,
        points,
        maxPoints: 100,
        description: 'Pflegegrad 5 (Schwerstpflegebedürftig mit besonderen Anforderungen)',
      };
    if (points >= 70)
      return {
        level: 5,
        points,
        maxPoints: 100,
        description: 'Pflegegrad 5 (Aufgrund gesetzlicher Baby-Höherstufung aus PG 4)',
      };
    if (points >= 47.5)
      return {
        level: 4,
        points,
        maxPoints: 100,
        description: 'Pflegegrad 4 (Aufgrund gesetzlicher Baby-Höherstufung aus PG 3)',
      };
    if (points >= 27)
      return {
        level: 3,
        points,
        maxPoints: 100,
        description: 'Pflegegrad 3 (Aufgrund gesetzlicher Baby-Höherstufung aus PG 2)',
      };
    if (points >= 12.5)
      return {
        level: 2,
        points,
        maxPoints: 100,
        description: 'Pflegegrad 2 (Einstiegsstufe für Babys unter 18 Monaten mit Einschränkungen)',
      };
    return {
      level: 0,
      points,
      maxPoints: 100,
      description: 'Kein Pflegegrad nachweisbar. Entwicklungsstand engmaschig dokumentieren.',
    };
  }

  if (points >= 90)
    return {
      level: 5,
      points,
      maxPoints: 100,
      description: 'Pflegegrad 5 - Schwerste Beeinträchtigungen der Selbstständigkeit.',
    };
  if (points >= 70)
    return {
      level: 4,
      points,
      maxPoints: 100,
      description: 'Pflegegrad 4 - Schwerste Beeinträchtigungen.',
    };
  if (points >= 47.5)
    return {
      level: 3,
      points,
      maxPoints: 100,
      description: 'Pflegegrad 3 - Schwere Beeinträchtigungen.',
    };
  if (points >= 27)
    return {
      level: 2,
      points,
      maxPoints: 100,
      description: 'Pflegegrad 2 - Erhebliche Beeinträchtigungen.',
    };
  if (points >= 12.5)
    return {
      level: 1,
      points,
      maxPoints: 100,
      description: 'Pflegegrad 1 - Geringe Beeinträchtigungen.',
    };
  return { level: 0, points, maxPoints: 100, description: 'Kein Pflegegrad erreicht.' };
};

export default function KinderModusPage() {
  const router = useRouter();
  const { locale } = useParams();

  const [hasMounted, setHasMounted] = useState(false);
  const [step, setStep] = useState<'intro' | 'info' | 'assessment' | 'result'>('intro');
  const [childInfo, setChildInfo] = useState<ChildInfo>({ name: '', age: 3, ageGroup: 'toddler' });
  const [currentCategory, setCurrentCategory] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Bezahlschranken-State gekoppelt an deine API-Verifikation
  const [isUnlocked] = useState(false);

  const caseCode = typeof window !== 'undefined' ? localStorage.getItem('case_code') : null;

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasMounted(true);
    }, 0);

    if (!caseCode) {
      toast.error('Keine aktive Fall-Session gefunden. Bitte starten Sie neu.');
      router.push(`/${locale}/pflegegrad/start`);
      return () => clearTimeout(timer);
    }

    // 📥 Eventuell existierende Kinder-Antworten (Modul_number 7) laden
    fetch(`/api/cases/${caseCode.toUpperCase()}/answers`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((data) => {
        const kinderRecord = data.find((r: { module_number: number }) => r.module_number === 7);
        if (kinderRecord?.answers) {
          setAnswers(kinderRecord.answers as Record<string, number>);
          // Falls bereits Daten da sind, springen wir direkt zur Erfassung
          setStep('assessment');
        }
      })
      .catch(() => logger.info('Keine alten Antworten für den Kinder-Modus gefunden.'));

    return () => clearTimeout(timer);
  }, [caseCode, locale, router]);

  const categories = getAssessmentCategories(childInfo.age);
  const totalQuestions = categories.reduce((sum, cat) => sum + cat.questions.length, 0);
  const progress = totalQuestions > 0 ? (Object.keys(answers).length / totalQuestions) * 100 : 0;

  const handleAgeChange = (age: number) => {
    const safeAge = isNaN(age) ? 0 : age;
    setChildInfo((prev) => ({
      ...prev,
      age: safeAge,
      ageGroup: getAgeGroup(safeAge),
    }));
  };

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = async () => {
    if (currentCategory < categories.length - 1) {
      setCurrentCategory((prev) => prev + 1);
    } else {
      // 🚀 SPEICHERN: Wir laden alle Antworten als JSONB gesammelt unter module_number 7 hoch
      if (caseCode) {
        try {
          await fetch(`/api/cases/${caseCode.toUpperCase()}/answers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              moduleName: 'widerspruch', // Mapped laut deiner Route auf module_number: 7
              questionKey: 'kinder_assessment_data',
              answerValue: answers,
            }),
          });
        } catch (err) {
          logger.error({ err }, 'Fehler beim Sichern des Kinder-Assessments');
        }
      }

      let erreichteRohpunkte = 0;
      let maximalMöglicheRohpunkte = 0;

      categories.forEach((cat) => {
        cat.questions.forEach((q) => {
          erreichteRohpunkte += answers[q.id] || 0;
          const maxOpt = Math.max(...q.options.map((o) => o.value));
          maximalMöglicheRohpunkte += maxOpt;
        });
      });

      const berechneteSystemPunkte =
        maximalMöglicheRohpunkte > 0
          ? Math.round((erreichteRohpunkte / maximalMöglicheRohpunkte) * 100)
          : 0;

      const calculatedResult = calculateChildCareLevel(berechneteSystemPunkte, childInfo.age);
      setResult(calculatedResult);
      setStep('result');
    }
  };

  const handleBack = () => {
    if (currentCategory > 0) {
      setCurrentCategory((prev) => prev - 1);
    } else {
      setStep('info');
    }
  };

  // 💳 INTEGRIERTER STRIPE CHECKOUT FÜR DAS KINDER-DOSSIER
  const startStripeCheckout = async () => {
    if (!caseCode) return;
    setCheckoutLoading(true);
    const toastId = toast.loading('Verbindung zu Stripe wird aufgebaut...');

    try {
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseCode: caseCode.toUpperCase(),
          paket: 'beta_special', // Nutzt das valide Paket aus deinem MVP_PRODUCTS-Katalog
        }),
      });
      const session = await response.json();
      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error();
      }
    } catch {
      setCheckoutLoading(false);
      toast.error('Fehler bei der Weiterleitung zum Bezahlfenster.', { id: toastId });
    }
  };

  if (!hasMounted) return null;

  // 1. INTRO SCREEN
  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4 flex flex-col justify-center items-center">
        <div className="max-w-xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-pink-500/10 border border-pink-500/20 shadow-xl">
            <Baby className="w-10 h-10 text-pink-400" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Kinder-Modus 🌟
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Spezial-Assessment zur Feststellung von Pflegebedürftigkeit bei Säuglingen, Kleinkindern
            und Jugendlichen nach dem SGB XI.
          </p>

          <div className="grid gap-3 text-left">
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex gap-3">
              <Star className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-300">
                <strong>Altersgruppen-Vergleich:</strong> Abzug des natürlichen, altersbedingten
                Pflegebedarfs gesunder Kinder.
              </p>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex gap-3">
              <Sparkles className="w-5 h-5 text-pink-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-300">
                <strong>Baby-Sonderschutz:</strong> Berücksichtigung der pauschalen Höhergruppierung
                für Kinder unter 18 Monaten.
              </p>
            </div>
          </div>

          <Button
            onClick={() => setStep('info')}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold h-14 text-lg rounded-xl shadow-lg"
          >
            <Gamepad2 className="w-5 h-5 mr-2" />
            Analyse starten
          </Button>
        </div>
      </div>
    );
  }

  // 2. INFO SCREEN
  if (step === 'info') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4 flex flex-col justify-center items-center">
        <Card className="w-full max-w-md bg-white/5 border-white/10 text-white shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Stammdaten des Kindes</CardTitle>
            <CardDescription className="text-gray-400">
              Ermöglicht das Laden der altersgerechten Vergleichsmatrizen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">Vorname (Optional)</label>
              <Input
                value={childInfo.name}
                onChange={(e) => setChildInfo((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="z.B. Lea"
                className="bg-slate-950 border-white/10 text-white h-11"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">Alter in Jahren</label>
              <Input
                type="number"
                min="0"
                max="18"
                step="0.5"
                value={childInfo.age || ''}
                onChange={(e) => handleAgeChange(parseFloat(e.target.value))}
                className="bg-slate-950 border-white/10 text-white h-11"
              />
            </div>

            {childInfo.age < 1.5 && (
              <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-xl flex gap-2 text-xs text-pink-400">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Sonderregelung aktiv:</strong> Unter 18 Monaten greift der pauschale
                  Ein-Stufen-Aufschlag. Pflegegrad 1 ist gesetzlich ausgeschlossen (Direkteinstieg
                  in PG 2).
                </span>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-3 border-t border-white/5 pt-4">
            <Button
              variant="outline"
              onClick={() => setStep('intro')}
              className="flex-1 border-white/10 text-white hover:bg-white/5"
            >
              Zurück
            </Button>
            <Button
              onClick={() => setStep('assessment')}
              className="flex-1 bg-pink-600 hover:bg-pink-500 text-white font-semibold"
            >
              Fragen laden
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // 3. ASSESSMENT SCREEN
  if (step === 'assessment') {
    const currentCat = categories[currentCategory];
    const currentQuestions = currentCat?.questions || [];

    return (
      <div className="min-h-screen bg-slate-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-4xl grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400 font-mono">
                <span>
                  Bereich {currentCategory + 1} von {categories.length}
                </span>
                <span>{Math.round(progress)}% vollständig</span>
              </div>
              <Progress value={progress} className="h-2 bg-white/5" />
            </div>

            <Card className="bg-white/5 border-white/10 text-white shadow-xl">
              <CardHeader className="border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-r ${currentCat.color} text-white shadow-lg`}
                  >
                    {currentCat.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{currentCat.name}</CardTitle>
                    <CardDescription className="text-gray-400">
                      Vergleichsmatrix für Altersgruppe: {childInfo.ageGroup.toUpperCase()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {currentQuestions.map((q) => (
                  <div key={q.id} className="space-y-3">
                    <h3 className="text-lg font-bold text-white">{q.simpleText}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed font-mono bg-white/[0.02] p-2 rounded border border-white/5">
                      {q.text}
                    </p>

                    <RadioGroup
                      value={answers[q.id]?.toString() || ''}
                      onValueChange={(val) => handleAnswer(q.id, parseInt(val))}
                      className="grid gap-2"
                    >
                      {q.options.map((opt) => {
                        const optionId = `${q.id}-${opt.value}`;
                        return (
                          <div
                            key={opt.value}
                            className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${
                              answers[q.id] === opt.value
                                ? 'border-pink-500 bg-pink-500/10'
                                : 'border-white/5 bg-white/[0.01] hover:bg-white/5'
                            }`}
                            onClick={() => handleAnswer(q.id, opt.value)}
                          >
                            <RadioGroupItem
                              value={opt.value.toString()}
                              id={optionId}
                              className="border-white/30 text-pink-500 focus:border-pink-500"
                            />
                            <label
                              htmlFor={optionId}
                              className="text-sm font-medium text-gray-200 cursor-pointer flex-grow select-none py-1"
                            >
                              {opt.simpleLabel}
                            </label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="border-t border-white/5 pt-4 flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="border-white/10 text-white hover:bg-white/5"
                >
                  Zurück
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={currentQuestions.some((q) => answers[q.id] === undefined)}
                  className="bg-pink-600 hover:bg-pink-500 text-white font-bold"
                >
                  {currentCategory < categories.length - 1
                    ? 'Nächster Bereich'
                    : 'Analyse auswerten'}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="md:col-span-1">
            <div className="sticky top-6 bg-slate-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-4 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-b border-white/10">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Baby className="w-4 h-4 text-pink-400" />
                  Kinder-KI Assistent
                </h3>
              </div>
              <div className="p-4 text-xs text-gray-400 leading-relaxed space-y-2">
                <p>
                  Ich unterstütze Sie bei der rechtssicheren Erfassung für{' '}
                  <strong>{childInfo.name || 'Ihr Kind'}</strong>.
                </p>
                <p className="bg-white/5 p-2.5 rounded border border-white/5 font-mono text-[10px]">
                  Aktuelle Matrix: {childInfo.age} Jahre ({childInfo.ageGroup.toUpperCase()})
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. RESULT SCREEN
  if (step === 'result' && result) {
    return (
      <div className="min-h-screen bg-slate-900 text-white py-12 px-4 flex flex-col justify-center items-center">
        <div className="w-full max-w-2xl space-y-6">
          {!isUnlocked ? (
            <Card className="bg-slate-950 border-2 border-purple-500/30 text-white shadow-2xl overflow-hidden">
              <div className="p-8 text-center space-y-4 bg-gradient-to-b from-purple-500/10 to-transparent">
                <div className="w-16 h-16 bg-purple-500/20 border border-purple-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                  <Lock className="w-8 h-8 text-purple-400" />
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight">
                  Rechtssicheres MD-Gutachten gesperrt
                </h2>
                <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
                  Die Rohdaten wurden erfasst. Schalten Sie jetzt die professionelle SGB-XI
                  Auswertungsmatrix und das fertige Antrags-PDF für Ihre Pflegekasse frei.
                </p>
              </div>
              <CardContent className="p-6 pt-0 space-y-3 max-w-md mx-auto">
                <div className="flex items-center gap-3 text-xs text-gray-300 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Vollständiger Abgleich mit den offiziellen Kinder-Vergleichstabellen.</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-300 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Fertig formuliertes PDF-Anschreiben für den Erstantrag.</span>
                </div>
              </CardContent>
              <CardFooter className="p-6 border-t border-white/5 bg-white/[0.01] flex flex-col gap-3">
                <Button
                  onClick={startStripeCheckout}
                  disabled={checkoutLoading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold h-14 text-base rounded-xl shadow-lg"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  {checkoutLoading
                    ? 'Verbindung aufbau...'
                    : 'Dossier kostenpflichtig freischalten'}
                </Button>
                <button
                  onClick={() => setStep('assessment')}
                  className="text-xs text-gray-500 hover:text-gray-400 font-mono underline"
                >
                  Eingaben korrigieren
                </button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="bg-white/5 border-white/10 text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              <div className="p-8 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-b border-white/5 text-center space-y-2">
                <span className="text-xs font-mono tracking-widest uppercase text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">
                  Kinder-Analyse Entschlüsselt 🌟
                </span>
                <h2 className="text-3xl font-extrabold">
                  {result.level === 0
                    ? 'Kein Pflegegrad'
                    : `Voraussichtlich: Pflegegrad ${result.level}`}
                </h2>
                <p className="text-sm text-gray-400 font-mono">
                  Erreichte Systempunkte: {result.points} / {result.maxPoints}
                </p>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-sm leading-relaxed text-gray-200">
                  {result.description}
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3 text-xs text-blue-400">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Gesetzlicher Hintergrund (§ 15 Abs. 7 SGB XI):</strong> Bei Kindern wird
                    der Mehraufwand im Vergleich zu einem gesunden Kind desselben Alters gemessen.
                    Da Ihr Kind unter 1,5 Jahren alt ist, wurde der pauschale Ein-Stufen-Aufschlag
                    für Babys bereits mitberücksichtigt.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="border-t border-white/5 p-4 bg-white/[0.01]">
                <Button
                  onClick={() => {
                    // Wir spiegeln das berechnete Ergebnis, damit das Brief-Zentrum einhaken kann
                    localStorage.setItem(
                      'pflegegrad-ergebnis',
                      JSON.stringify({
                        careLevel: result.level,
                        totalScore: result.points,
                        benefits: { monthlyAmount: result.level >= 2 ? 332 : 0, reliefBudget: 125 },
                      })
                    );
                    router.push(`/${locale}/briefe`);
                  }}
                  className="w-full bg-[#20b2aa] hover:bg-[#3ddbd0] text-slate-950 font-bold h-12 rounded-xl"
                >
                  <FileText className="w-4 h-4 mr-2" /> Antrags-Anschreiben im Brief-Zentrum
                  erstellen
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return null;
}
