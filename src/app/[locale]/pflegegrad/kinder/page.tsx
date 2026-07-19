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
  HeartPulse,
  Home,
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
import {
  loadModuleAnswers,
  saveModuleAnswers,
  SessionExpiredError,
} from '@/src/lib/pflegegrad/client-api';
import { NBA_CONFIG } from '@/src/lib/pflegegrad/constants';
import {
  AgeGroup,
  BABY_AGE_LIMIT_YEARS,
  calculateChildAssessment,
  getAgeGroup,
  getAssessmentCategories,
  KinderAssessmentResult,
} from '@/src/lib/pflegegrad/kinder';

interface ChildInfo {
  name: string;
  age: number;
  ageGroup: AgeGroup;
}

// UI-Dekoration der fachlichen Kategorien — die Fachlogik (Fragen, Bewertung,
// Baby-Sonderregel) liegt vollständig in src/lib/pflegegrad/kinder.ts
const CATEGORY_STYLES: Record<string, { icon: React.ReactNode; color: string }> = {
  mobilitaet: { icon: <Activity className="w-6 h-6" />, color: 'from-pink-500 to-rose-600' },
  kognition: { icon: <Puzzle className="w-6 h-6" />, color: 'from-purple-500 to-indigo-600' },
  verhalten: { icon: <Sparkles className="w-6 h-6" />, color: 'from-amber-500 to-orange-600' },
  selbstversorgung: {
    icon: <Utensils className="w-6 h-6" />,
    color: 'from-emerald-500 to-teal-600',
  },
  krankheitsbewaeltigung: {
    icon: <HeartPulse className="w-6 h-6" />,
    color: 'from-rose-500 to-red-600',
  },
  alltag: { icon: <Home className="w-6 h-6" />, color: 'from-sky-500 to-blue-600' },
};

export default function KinderModusPage() {
  const router = useRouter();
  const { locale } = useParams();

  const [hasMounted, setHasMounted] = useState(false);
  const [step, setStep] = useState<'intro' | 'info' | 'assessment' | 'result'>('intro');
  const [childInfo, setChildInfo] = useState<ChildInfo>({ name: '', age: 3, ageGroup: 'toddler' });
  const [currentCategory, setCurrentCategory] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<KinderAssessmentResult | null>(null);
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

    // 📥 Eventuell existierende Kinder-Antworten laden
    loadModuleAnswers<Record<string, number>>(caseCode, 'kinder')
      .then((kinderAnswers) => {
        if (kinderAnswers && Object.keys(kinderAnswers).length > 0) {
          setAnswers(kinderAnswers);
          // Falls bereits Daten da sind, springen wir direkt zur Erfassung
          setStep('assessment');
        }
      })
      .catch((err) => {
        if (err instanceof SessionExpiredError) {
          toast.error('Ihre Fall-Session ist abgelaufen. Bitte laden Sie Ihren Fall erneut.');
          router.push(`/${locale}/pflegegrad/start`);
          return;
        }
        logger.info('Keine alten Antworten für den Kinder-Modus gefunden.');
      });

    return () => clearTimeout(timer);
  }, [caseCode, locale, router]);

  const categories = getAssessmentCategories(childInfo.age);
  const totalQuestions = categories.reduce((sum, cat) => sum + cat.questions.length, 0);
  // Nur Antworten auf aktuell relevante Fragen zählen — nach einem Alterswechsel
  // können sonst verwaiste Antwort-Keys den Fortschritt verfälschen
  const answeredCount = categories.reduce(
    (sum, cat) => sum + cat.questions.filter((q) => answers[q.id] !== undefined).length,
    0
  );
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

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
      // 🚀 SPEICHERN: kompletter Kinder-Antwortstand in einem atomaren Request
      if (caseCode) {
        try {
          await saveModuleAnswers(caseCode, 'kinder', answers);
        } catch (err) {
          if (err instanceof SessionExpiredError) {
            toast.error('Ihre Fall-Session ist abgelaufen. Bitte laden Sie Ihren Fall erneut.');
            router.push(`/${locale}/pflegegrad/start`);
            return;
          }
          logger.error({ err }, 'Fehler beim Sichern des Kinder-Assessments');
          toast.error('Speichern fehlgeschlagen. Das Ergebnis wird nur lokal berechnet.');
        }
      }

      // NBA-Bewertung inkl. Modulgewichtung, Höchstwertprinzip M2/M3 und
      // Baby-Sonderregel (§ 15 Abs. 7 SGB XI) — vollständig in der Fachlogik
      const calculatedResult = calculateChildAssessment(answers, childInfo.age);
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
          locale,
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

            {childInfo.age < BABY_AGE_LIMIT_YEARS && (
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
    // Index klemmen: Ein Alterswechsel (z.B. auf < 18 Monate) kann die
    // Kategorienanzahl reduzieren, während currentCategory noch höher steht
    const safeCategoryIndex = Math.min(currentCategory, categories.length - 1);
    const currentCat = categories[safeCategoryIndex];
    const currentQuestions = currentCat?.questions || [];

    return (
      <div className="min-h-screen bg-slate-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-4xl grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400 font-mono">
                <span>
                  Bereich {safeCategoryIndex + 1} von {categories.length}
                </span>
                <span>{Math.round(progress)}% vollständig</span>
              </div>
              <Progress value={progress} className="h-2 bg-white/5" />
            </div>

            <Card className="bg-white/5 border-white/10 text-white shadow-xl">
              <CardHeader className="border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-r ${CATEGORY_STYLES[currentCat.id]?.color ?? 'from-pink-500 to-rose-600'} text-white shadow-lg`}
                  >
                    {CATEGORY_STYLES[currentCat.id]?.icon ?? <Star className="w-6 h-6" />}
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
                    <strong>Gesetzlicher Hintergrund (§ 15 Abs. 6/7 SGB XI):</strong> Bei Kindern
                    wird der Mehraufwand im Vergleich zu einem gesunden Kind desselben Alters
                    gemessen.{' '}
                    {result.babyRuleApplied
                      ? 'Da Ihr Kind unter 18 Monaten alt ist, wurden nur die altersunabhängigen Bereiche bewertet und der pauschale Ein-Stufen-Aufschlag bereits mitberücksichtigt.'
                      : 'Bewertet wurden alle sechs gesetzlichen Lebensbereiche mit den amtlichen Modulgewichtungen.'}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="border-t border-white/5 p-4 bg-white/[0.01]">
                <Button
                  onClick={() => {
                    // Leistungsbeträge aus der zentralen Gesetzeskonfiguration
                    // statt hartkodiert — bleibt bei Satzänderungen konsistent
                    const benefits = NBA_CONFIG.BENEFITS[
                      result.level as keyof typeof NBA_CONFIG.BENEFITS
                    ] ?? { monthly: 0, relief: 0 };
                    localStorage.setItem(
                      'pflegegrad-ergebnis',
                      JSON.stringify({
                        careLevel: result.level,
                        totalScore: result.points,
                        benefits: {
                          monthlyAmount: benefits.monthly,
                          reliefBudget: benefits.relief,
                        },
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
