// src/app/[locale]/gdb/_component/step-sektor-form.tsx
import { ArrowLeft } from 'lucide-react';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
} from '@/src/components/ui';
import { GdBSektor } from '@/src/types/gdb';

interface Props {
  sektoren: GdBSektor[];
  werte: Record<string, number>;
  onChange: (sektorId: string, wert: number) => void;
  onBack: () => void;
  onCalculate: () => void;
}

export function StepSektorForm({ sektoren, werte, onChange, onBack, onCalculate }: Props) {
  return (
    <Card className="bg-white/5 border-white/10 text-white shadow-xl">
      <CardHeader>
        <CardTitle>Medizinische Funktionsbeeinträchtigungen</CardTitle>

        <CardDescription>Wählen Sie für jeden Bereich die passende Stufe.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {sektoren.map((sektor) => (
          <div
            key={sektor.id}
            className="space-y-2 bg-slate-950/20 p-4 border border-white/5 rounded-xl"
          >
            <Label className="font-bold">{sektor.label}</Label>

            <p className="text-xs text-gray-400">{sektor.beschreibung}</p>

            <select
              className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl px-3"
              value={werte[sektor.id] || 0}
              onChange={(e) => onChange(sektor.id, Number(e.target.value))}
            >
              {sektor.werte.map((option) => (
                <option key={option.label} value={option.wert}>
                  {option.wert > 0 ? `[GdB ${option.wert}] ${option.label}` : option.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 w-4 h-4" />
            Zurück
          </Button>

          <Button onClick={onCalculate} className="bg-[#20b2aa] text-slate-950">
            Gesamt-GdB berechnen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
