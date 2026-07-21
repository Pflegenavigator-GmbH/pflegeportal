// src/app/[locale]/tagebuch/_component/TagebuchForm.tsx
'use client';

import { Save, Sparkles, X, Mic } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
} from '@/src/components/ui';
import { TagebuchEintrag, PflegeHelfer, SchlafQualitaet } from '@/src/types/tagebuch';

export interface TagebuchFormProps {
  caseCode: string;
  onSavedAction: () => void;
  entryToEdit: { key: string; data: TagebuchEintrag } | null;
  onCancelAction: () => void;
}

export function TagebuchForm({
  caseCode,
  onSavedAction,
  entryToEdit,
  onCancelAction,
}: TagebuchFormProps) {
  // 🪄 REPARATUR: States direkt aus der Prop ableiten statt über einen useEffect
  const [datum, setDatum] = useState(() =>
    entryToEdit ? entryToEdit.data.date.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [content, setContent] = useState(() => (entryToEdit ? entryToEdit.data.content : ''));
  const [helfer, setHelfer] = useState<PflegeHelfer>(() =>
    entryToEdit ? entryToEdit.data.helfer || 'Hauptpflegeperson' : 'Hauptpflegeperson'
  );
  const [schmerzen, setSchmerzen] = useState<number>(() =>
    entryToEdit ? (entryToEdit.data.schmerzen ?? 5) : 5
  );
  const [schlaf, setSchlaf] = useState<SchlafQualitaet>(() =>
    entryToEdit ? entryToEdit.data.schlaf || 'Gut' : 'Gut'
  );

  const [sturz, setSturz] = useState(() => !!entryToEdit?.data?.sturz);
  const [arzttermin, setArzttermin] = useState(() => !!entryToEdit?.data?.arzttermin);
  const [krankenhaus, setKrankenhaus] = useState(() => !!entryToEdit?.data?.krankenhaus);
  const [bettlaegerig, setBettlaegerig] = useState(() => !!entryToEdit?.data?.bettlaegerig);
  const [medikamentenKontrolle, setMedikamentenKontrolle] = useState(
    () => !!entryToEdit?.data?.medikamentenKontrolle
  );

  const [isSaving, setIsSaving] = useState(false);

  const speichern = async () => {
    if (!content.trim())
      return toast.error('Bitte beschreiben Sie, was nicht alleine gemacht werden konnte.');
    setIsSaving(true);

    try {
      const response = await fetch('/api/tagebuch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseCode,
          entryKey: entryToEdit?.key,
          payload: {
            date: datum,
            content,
            helfer,
            schmerzen,
            schlaf,
            sturz,
            arzttermin,
            krankenhaus,
            bettlaegerig,
            medikamentenKontrolle,
          },
        }),
      });

      if (!response.ok) throw new Error();

      toast.success(entryToEdit ? 'Eintrag aktualisiert!' : 'Eintrag gespeichert!');
      onSavedAction();
    } catch {
      toast.error('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-xl text-slate-900">
      <CardHeader className="pb-3 border-b border-gray-100 bg-slate-50">
        <CardTitle className="text-lg flex items-center justify-between font-bold text-[#0f2744]">
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            {entryToEdit ? 'Eintrag bearbeiten' : 'Neuer Tagebucheintrag'}
          </span>
          <Button variant="outline" size="sm" className="h-9 gap-1 border-gray-300 text-slate-700">
            <Mic className="w-4 h-4 text-[#1a4480]" /> Sprach-Eingabe
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4 text-sm">
        {/* Datum */}
        <div>
          <label className="block font-bold text-xs uppercase text-gray-500 mb-1">Datum</label>
          <Input
            type="date"
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
            onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
            className="border-gray-300 focus:border-[#1a4480] text-base h-11 text-slate-900 bg-white [color-scheme:light]"
          />
        </div>

        {/* Wer hat geholfen */}
        <div>
          <label className="block font-bold text-xs uppercase text-gray-500 mb-1">
            Wer hat heute geholfen?
          </label>
          <select
            value={helfer}
            onChange={(e) => setHelfer(e.target.value as PflegeHelfer)}
            className="w-full h-11 px-3 rounded-md border border-gray-300 bg-white shadow-sm focus:border-[#1a4480] focus:ring-1 focus:ring-[#1a4480] text-base text-slate-900"
          >
            <option value="Hauptpflegeperson">Hauptpflegeperson (Angehörige)</option>
            <option value="Pflegedienst">Pflegedienst (Professionell)</option>
            <option value="Andere Person">Andere Person (Nachbarn/Freunde)</option>
            <option value="Niemand">Niemand (Selbstständig bewältigt)</option>
          </select>
        </div>

        {/* Freitext-Beschreibung */}
        <div>
          <label className="block font-bold text-xs uppercase text-gray-500 mb-1">
            Was konnte nicht alleine gemacht werden?
          </label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="z.B. Hilfe beim Aufstehen, Duschen oder Kochen benötigt..."
            className="border-gray-300 focus:border-[#1a4480] text-base text-slate-900 bg-white placeholder:text-gray-400"
          />
        </div>

        {/* Schmerz-Skala */}
        <div>
          <label className="block font-bold text-xs uppercase text-gray-500 mb-1 flex justify-between">
            <span>Schmerzen heute:</span>
            <span className="font-mono text-base font-bold text-[#1a4480]">{schmerzen}/10</span>
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={schmerzen}
            onChange={(e) => setSchmerzen(Number(e.target.value))}
            className="w-full accent-[#0f2744] h-2 bg-gray-200 rounded-lg cursor-pointer"
          />
        </div>

        {/* Schlaf-Struktur */}
        <div>
          <label className="block font-bold text-xs uppercase text-gray-500 mb-2">
            Wie war der Schlaf nachts?
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Gut', 'Unterbrochen', 'Schlecht'] as SchlafQualitaet[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSchlaf(s)}
                className={`py-2 px-3 rounded-md text-center font-medium border transition-all ${
                  schlaf === s
                    ? 'bg-[#1a4480] text-white border-[#1a4480]'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Besonderheiten Checkboxen */}
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <label className="block font-bold text-xs uppercase text-gray-500 mb-1">
            Besonderheiten / Ereignisse
          </label>

          <div className="grid grid-cols-2 gap-2 text-slate-900">
            <label className="flex items-center gap-2 p-2 rounded border border-gray-200 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={sturz}
                onChange={(e) => setSturz(e.target.checked)}
                className="rounded text-[#1a4480]"
              />
              <span>Sturz / Unfall</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded border border-gray-200 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={arzttermin}
                onChange={(e) => setArzttermin(e.target.checked)}
                className="rounded text-[#1a4480]"
              />
              <span>Arzttermin</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded border border-gray-200 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={krankenhaus}
                onChange={(e) => setKrankenhaus(e.target.checked)}
                className="rounded text-[#1a4480]"
              />
              <span>Krankenhaus</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded border border-gray-200 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={bettlaegerig}
                onChange={(e) => setBettlaegerig(e.target.checked)}
                className="rounded text-[#1a4480]"
              />
              <span>Bettlägerigkeit</span>
            </label>
          </div>

          <label className="flex items-center gap-2 p-2 mt-1 rounded bg-blue-50 border border-blue-100 cursor-pointer text-slate-900">
            <input
              type="checkbox"
              checked={medikamentenKontrolle}
              onChange={(e) => setMedikamentenKontrolle(e.target.checked)}
              className="rounded text-[#1a4480]"
            />
            <span className="text-xs text-slate-700 font-medium">
              Medikamentenkontrolle durch Pfledienst erfolgt?
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <Button
            onClick={speichern}
            disabled={isSaving}
            className="w-full h-[56px] bg-[#0f2744] hover:bg-[#1a4480] text-white text-base font-bold transition-all shadow-md"
          >
            <Save className="mr-2 w-5 h-5" /> {isSaving ? 'Wird gespeichert...' : 'Eintrag sichern'}
          </Button>

          {entryToEdit && (
            <Button
              variant="outline"
              onClick={onCancelAction}
              className="w-full h-[56px] text-gray-500 border-gray-300 text-base font-medium"
            >
              <X className="mr-2 w-5 h-5" /> Bearbeitung abbrechen
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
