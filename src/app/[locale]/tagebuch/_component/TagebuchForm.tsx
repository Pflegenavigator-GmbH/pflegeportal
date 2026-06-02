// src/app/[locale]/tagebuch/_component/TagebuchForm.tsx
'use client';
import { useState, useEffect } from 'react';
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { toast } from 'sonner';
import { Save, Sparkles, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { TagebuchEintrag } from '@/src/types/tagebuch';

export function TagebuchForm({
                                 caseCode,
                                 onSaved,
                                 entryToEdit,
                                 onCancel
                             }: {
    caseCode: string,
    onSaved: () => void,
    entryToEdit: {key: string, data: TagebuchEintrag} | null,
    onCancel: () => void
}) {
    const [eintrag, setEintrag] = useState("");
    const [datum, setDatum] = useState(new Date().toISOString().split("T")[0]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Sicherer Zugriff: Nur wenn entryToEdit und data und date existieren
        if (entryToEdit?.data?.date) {
            setEintrag(entryToEdit.data.content || "");
            // Sicherstellen, dass wir das Datum sauber extrahieren
            const dateString = entryToEdit.data.date.split("T")[0];
            setDatum(dateString);
        } else {
            // Reset auf Default-Werte
            setEintrag("");
            setDatum(new Date().toISOString().split("T")[0]);
        }
    }, [entryToEdit]); // Abhängigkeit ist korrekt

    const speichern = async () => {
        if (!eintrag.trim()) return toast.error("Bitte einen Text eingeben");
        setIsSaving(true);

        try {
            const response = await fetch('/api/tagebuch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    caseCode,
                    content: eintrag,
                    date: datum
                })
            });

            if (!response.ok) throw new Error();

            toast.success(entryToEdit ? "Eintrag aktualisiert!" : "Eintrag gespeichert!");
            setEintrag("");
            onSaved();
        } catch {
            toast.error("Fehler beim Speichern");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="bg-gradient-to-br from-white/10 to-transparent border-white/10 shadow-2xl">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    {entryToEdit ? "Eintrag bearbeiten" : "Neuer Eintrag"}
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
                    <Save className="mr-2 w-4 h-4" /> {isSaving ? "Speichere..." : "Speichern"}
                </Button>
                {entryToEdit && (
                    <Button variant="ghost" onClick={onCancel} className="w-full text-gray-400 hover:text-white">
                        <X className="mr-2 w-4 h-4" /> Abbrechen
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}