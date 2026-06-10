// src/app/[locale]/pflegegrad/modul2/components/KognitionForm.tsx
'use client';

import { Brain, HelpCircle } from 'lucide-react';

import { Card, CardContent } from '@/src/components/ui/card';
import { Label } from '@/src/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group';
import { Frage, BewertungOption } from '@/src/types/pflegegrad';

interface KognitionFormProps {
  fragen: Frage[];
  optionen: BewertungOption[];
  antworten: Record<string, string>;
  onAntwort: (frageId: string, wert: string) => void;
}

export function KognitionForm({ fragen, optionen, antworten, onAntwort }: KognitionFormProps) {
  return (
    <div className="space-y-6">
      {fragen.map((frage) => (
        <Card key={frage.id} className="bg-white/5 border-white/10 text-white shadow-xl">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold flex items-start gap-2 leading-snug">
                <Brain className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                {frage.text}
              </h3>
              <p className="text-sm text-gray-400 flex items-center gap-1.5 pl-7">
                <HelpCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />
                {frage.hilfe}
              </p>
            </div>

            <RadioGroup
              value={antworten[frage.id] || ''}
              onValueChange={(wert) => onAntwort(frage.id, wert)}
              className="grid gap-2 pl-7"
            >
              {optionen.map((opt) => {
                const optionId = `${frage.id}-${opt.value}`;
                return (
                  <div
                    key={opt.value}
                    className="flex items-center space-x-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => onAntwort(frage.id, opt.value)}
                  >
                    <RadioGroupItem
                      value={opt.value}
                      id={optionId}
                      className="border-white/30 text-[#20b2aa] focus:border-[#20b2aa] h-5 w-5"
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
