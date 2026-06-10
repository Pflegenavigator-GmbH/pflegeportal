// src

'use client';

import { Label } from '@/src/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group';

export interface AlltagsFrage {
  id: string;
  key: 'haushalt' | 'einkaufen' | 'kochen' | 'finanzen' | 'entscheidungen';
  text: string;
  optionen: {
    value: string;
    title: string;
    sub: string;
  }[];
}

interface AlltagsgestaltungFormProps {
  fragen: AlltagsFrage[];
  antworten: Record<string, string>;
  onAntwort: (key: string, value: string) => void;
}

export function AlltagsgestaltungForm({
  fragen,
  antworten,
  onAntwort,
}: AlltagsgestaltungFormProps) {
  return (
    <div className="space-y-6">
      {fragen.map((fr) => (
        <div key={fr.id} className="space-y-3 bg-white/[0.02] border border-white/5 p-5 rounded-xl">
          <h3 className="font-semibold text-white text-base leading-snug">{fr.text}</h3>
          <RadioGroup
            value={antworten[fr.key] || ''}
            onValueChange={(v) => onAntwort(fr.key, v)}
            className="grid gap-2"
          >
            {fr.optionen.map((opt) => {
              const optionId = `${fr.id}-${opt.value}`;
              return (
                <div
                  key={opt.value}
                  className="flex items-start space-x-3 p-3 rounded-xl bg-white/[0.01] border border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => onAntwort(fr.key, opt.value)}
                >
                  <RadioGroupItem
                    value={opt.value}
                    id={optionId}
                    className="border-white/30 text-[#20b2aa] focus:border-[#20b2aa] h-5 w-5 mt-0.5 flex-shrink-0"
                  />
                  <Label
                    htmlFor={optionId}
                    className="text-gray-200 cursor-pointer flex flex-col flex-grow select-none"
                  >
                    <span className="font-semibold text-base text-white">{opt.title}</span>
                    <span className="text-sm text-gray-400 font-normal mt-0.5">{opt.sub}</span>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>
      ))}
    </div>
  );
}
