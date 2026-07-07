// src/app/[locale]/gdb/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';

import { GdbFooter } from '@/src/app/[locale]/gdb/_component/gdb-footer';
import { GdbHeader } from '@/src/app/[locale]/gdb/_component/gdb-header';
import { GdbWarning } from '@/src/app/[locale]/gdb/_component/gdb-warning';
import { StepErgebnisCard } from '@/src/app/[locale]/gdb/_component/step-ergebins-card';
import { StepIntroCard } from '@/src/app/[locale]/gdb/_component/step-into-card';
import { StepSektorForm } from '@/src/app/[locale]/gdb/_component/step-sektor-form';
import { gdbSektoren } from '@/src/app/[locale]/gdb/_constants/gdb-sektoren';
import { berechneGesamtGdB } from '@/src/lib/gdb/berechne-gesamt-gdb';

type GdbErgebnis = {
  gdb: number;
  vorteile: string[];
};

export default function GdBRechnerPage() {
  const params = useParams();
  const locale = typeof params?.locale === 'string' ? params.locale : 'de';

  const [step, setStep] = useState(1);
  const [selektierteWerte, setSelektierteWerte] = useState<Record<string, number>>({});
  const [ergebnis, setErgebnis] = useState<GdbErgebnis | null>(null);

  const handleWertChange = (sektorId: string, wert: number) => {
    setSelektierteWerte((prev) => ({
      ...prev,
      [sektorId]: wert,
    }));
  };

  const handleBerechnung = () => {
    const result = berechneGesamtGdB(selektierteWerte);
    setErgebnis(result);
    setStep(3);
  };

  const handleReset = () => {
    setSelektierteWerte({});
    setErgebnis(null);
    setStep(2);
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white font-sans py-12 px-4">
      <div className="container mx-auto max-w-3xl space-y-8">
        <GdbHeader />
        <GdbWarning />

        {step === 1 && <StepIntroCard onNext={() => setStep(2)} />}

        {step === 2 && (
          <StepSektorForm
            sektoren={gdbSektoren}
            werte={selektierteWerte}
            onChange={handleWertChange}
            onBack={() => setStep(1)}
            onCalculate={handleBerechnung}
          />
        )}

        {step === 3 && ergebnis && (
          <StepErgebnisCard locale={locale} ergebnis={ergebnis} onReset={handleReset} />
        )}

        <GdbFooter />
      </div>
    </main>
  );
}
