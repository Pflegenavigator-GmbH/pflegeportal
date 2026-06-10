// src/app/[locale]/pflegegrad/modul5/_components/KrankheitsbewaeltigungForm.tsx

'use client';

import { HeartPulse, HelpCircle } from 'lucide-react';

import { Card, CardContent } from '@/src/components/ui/card';
import { Label } from '@/src/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group';
import { Frage, BewertungOption } from '@/src/types/pflegegrad';

interface KrankheitsbewaeltigungFormProps {
  fragen: Frage[];
  optionen: BewertungOption[];
  antworten: Record<string, string>;
  onAntwort: (frageId: string, wert: string) => void;
}

export function KrankheitsbewaeltigungForm({
  fragen,
  optionen,
  antworten,
  onAntwort,
}: KrankheitsbewaeltigungFormProps) {
  return (
    <div className="space-y-6">
      {fragen.map((fr) => (
        <Card
          key={fr.id}
          className="bg-white/5 border-rose-500/10 text-white shadow-xl hover:border-rose-500/20 transition-colors"
        >
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold flex items-start gap-2 leading-snug">
                <HeartPulse className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
                {fr.text}
              </h3>
              <p className="text-sm text-gray-400 flex items-center gap-1.5 pl-7">
                <HelpCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />
                {fr.hilfe}
              </p>
            </div>

            <RadioGroup
              value={antworten[fr.id] || ''}
              onValueChange={(wert) => onAntwort(fr.id, wert)}
              className="grid gap-2 pl-7"
            >
              {optionen.map((opt) => {
                const optionId = `${fr.id}-${opt.value}`;
                return (
                  <div
                    key={opt.value}
                    className="flex items-center space-x-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => onAntwort(fr.id, opt.value)}
                  >
                    <RadioGroupItem
                      value={opt.value}
                      id={optionId}
                      className="border-white/30 text-rose-400 focus:border-rose-400 h-5 w-5"
                    />
                    <Label
                      htmlFor={optionId}
                      className="text-gray-200 font-medium cursor-pointer flex-grow py-1 text-base select-none"
                    >
                      {opt.label}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
