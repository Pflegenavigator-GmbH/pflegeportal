// src/app/[locale]/pflegegrad/modul1/page.tsx
'use client';

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { ArrowRight, ArrowLeft, Accessibility } from "lucide-react";
import { FRAGEN_MODUL_1, BEWERTUNGEN } from "@/src/lib/pflegegrad/fragen";
import { toast } from "sonner";

export default function Modul1Page() {
    const router = useRouter();
    const { locale } = useParams();
    const [antworten, setAntworten] = useState<Record<string, string>>({});

    const handleAntwort = (frageId: string, wert: string) => {
        setAntworten(prev => ({ ...prev, [frageId]: wert }));
    };

    const handleWeiter = async () => {
        // Rohpunkte aufsummieren
        let rohPunkte = 0;
        Object.entries(antworten).forEach(([_, wert]) => {
            const option = BEWERTUNGEN.find(b => b.value === wert);
            if (option) rohPunkte += option.punkte;
        });

        // Lokale Zwischenspeicherung
        localStorage.setItem("m1_score", rohPunkte.toString());

        // API-Synchronisierung mit unserer Supabase-Save-Route
        try {
            await fetch('/api/pflegegrad/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    caseCode: localStorage.getItem('case_code') || 'PF-TEMP-1234',
                    moduleNumber: 1,
                    moduleName: 'Mobilität',
                    answers: antworten
                })
            });
            toast.success("Fortschritt online gespeichert!");
        } catch {
            toast.error("Offline-Modus: Fortschritt lokal gesichert.");
        }

        router.push(`/${locale}/pflegegrad/modul2`);
    };

    const alleBeantwortet = Object.keys(antworten).length === FRAGEN_MODUL_1.length;
    const fortschritt = (Object.keys(antworten).length / FRAGEN_MODUL_1.length) * 100;

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl text-white">
            {/* Modul-Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-emerald-600/20 rounded-xl border border-emerald-500/30">
                        <Accessibility className="w-6 h-6 text-[#20b2aa]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Modul 1: Mobilität</h1>
                        <p className="text-sm text-gray-400">Gewichtung im Gesamtverfahren: 10%</p>
                    </div>
                </div>

                {/* Fortschrittsbalken */}
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#20b2aa] h-full transition-all duration-300" style={{ width: `${fortschritt}%` }} />
                </div>
            </div>

            {/* Fragen-Liste */}
            <div className="space-y-6">
                {FRAGEN_MODUL_1.map((frage, index) => (
                    <motion.div
                        key={frage.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Card className="bg-white/5 border-white/10 text-white">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-semibold mb-1">{frage.text}</h3>
                                <p className="text-sm text-gray-400 mb-4">{frage.hilfe}</p>

                                <RadioGroup
                                    value={antworten[frage.id] || ""}
                                    onValueChange={(wert) => handleAntwort(frage.id, wert)}
                                    className="grid sm:grid-cols-2 gap-3"
                                >
                                    {BEWERTUNGEN.map((b) => (
                                        <div
                                            key={b.value}
                                            className={`flex items-center space-x-2 p-3 rounded-lg border transition-all cursor-pointer ${
                                                antworten[frage.id] === b.value
                                                    ? 'border-[#20b2aa] bg-[#20b2aa]/10'
                                                    : 'border-white/10 hover:bg-white/5'
                                            }`}
                                        >
                                            <RadioGroupItem value={b.value} id={`${frage.id}-${b.value}`} className="border-white text-[#20b2aa]" />
                                            <Label htmlFor={`${frage.id}-${b.value}`} className="cursor-pointer text-sm font-medium w-full">
                                                {b.label}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Navigations-Buttons */}
            <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={() => router.push(`/${locale}`)} className="border-white/10 text-white hover:bg-white/5">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Abbrechen
                </Button>

                <Button onClick={handleWeiter} disabled={!alleBeantwortet} className="bg-[#20b2aa] hover:bg-[#3ddbd0] text-white disabled:opacity-40">
                    Weiter zu Modul 2 <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}