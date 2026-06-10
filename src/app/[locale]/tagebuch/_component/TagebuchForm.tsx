// src/app/[locale]/tagebuch/_component/TagebuchForm.tsx
'use client';

import { Save, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { TagebuchEintrag } from '@/src/types/tagebuch';

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
  const [eintrag, setEintrag] = useState(() => entryToEdit?.data?.content || '');
  const [datum, setDatum] = useState(() =>
    entryToEdit?.data?.date
      ? entryToEdit.data.date.split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [isSaving, setIsSaving] = useState(false);

  const [prevEntryKey, setPrevEntryKey] = useState<string | null>(entryToEdit?.key || null);

  if (entryToEdit?.key !== prevEntryKey) {
    setPrevEntryKey(entryToEdit?.key || null);
    setEintrag(entryToEdit?.data?.content || '');
    setDatum(
      entryToEdit?.data?.date
        ? entryToEdit.data.date.split('T')[0]
        : new Date().toISOString().split('T')[0]
    );
  }

  const speichern = async () => {
    if (!eintrag.trim()) return toast.error('Bitte einen Text eingeben');
    setIsSaving(true);

    try {
      const response = await fetch('/api/tagebuch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseCode,
          content: eintrag,
          date: datum,
        }),
      });

      if (!response.ok) throw new Error();

      toast.success(entryToEdit ? 'Eintrag aktualisiert!' : 'Eintrag gespeichert!');
      setEintrag('');
      onSavedAction();
    } catch {
      toast.error('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-white/10 to-transparent border-white/10 shadow-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          {entryToEdit ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="date"
          value={datum}
          onChange={(e) => setDatum(e.target.value)}
          className="bg-slate-950 border-white/20 text-white [color-scheme:dark] h-10 w-full"
        />
        <Textarea
          value={eintrag}
          onChange={(e) => setEintrag(e.target.value)}
          rows={6}
          placeholder="Stimmung, Pflegeaufwand..."
          className="bg-slate-950 border-white/20 text-white placeholder:text-gray-400 focus:border-[#20b2aa] focus:ring-1 focus:ring-[#20b2aa] transition-all"
        />
        <Button
          onClick={speichern}
          disabled={isSaving}
          className="w-full bg-[#20b2aa] hover:bg-[#3ddbd0] text-slate-900 font-bold"
        >
          <Save className="mr-2 w-4 h-4" /> {isSaving ? 'Speichere...' : 'Speichern'}
        </Button>
        {entryToEdit && (
          <Button
            variant="ghost"
            onClick={onCancelAction}
            className="w-full text-gray-400 hover:text-white"
          >
            <X className="mr-2 w-4 h-4" /> Abbrechen
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
