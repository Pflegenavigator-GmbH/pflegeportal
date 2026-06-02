'use client';

import { useRouter } from 'next/navigation';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    FileText,
    Percent,
    Shield,
} from 'lucide-react';

interface Ergebnis {
    gdb: number;
    vorteile: string[];
}

interface StepErgebnisCardProps {
    locale: string;
    ergebnis: Ergebnis;
    onReset: () => void;
}

export function StepErgebnisCard({
                                     locale,
                                     ergebnis,
                                     onReset,
                                 }: StepErgebnisCardProps) {
    const router = useRouter();

    return (
        <>
            <Card className="bg-white/5 border-white/10 text-white shadow-2xl overflow-hidden">
                <div className="p-8 text-center bg-gradient-to-br from-white/[0.02] to-transparent space-y-3">
                    <p className="text-gray-400 text-xs sm:text-sm tracking-wide uppercase font-mono">
                        Voraussichtlicher Grad der Behinderung
                    </p>

                    <div className="text-6xl font-extrabold tracking-tight text-[#20b2aa]">
                        {ergebnis.gdb}
                    </div>

                    <p className="text-gray-500 text-[11px] max-w-xs mx-auto">
                        Ermittelt über den gewichteten Reduktions-Schlüssel der
                        Versorgungsmedizin-Verordnung.
                    </p>
                </div>

                {ergebnis.vorteile.length > 0 && (
                    <CardContent className="border-t border-white/5 pt-5 space-y-3">
                        <h3 className="font-bold text-sm flex items-center gap-2 text-white">
                            <Percent className="w-4 h-4 text-[#20b2aa]" />
                            Aktivierbare Nachteilsausgleiche (2026)
                        </h3>

                        <div className="grid gap-2">
                            {ergebnis.vorteile.map((vorteil, i) => (
                                <div
                                    key={i}
                                    className="flex items-start gap-2.5 p-3 bg-slate-950/40 border border-white/5 rounded-xl text-xs text-gray-300"
                                >
                                    <Check className="w-4 h-4 text-[#20b2aa] flex-shrink-0 mt-0.5" />
                                    <span>{vorteil}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                )}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white/5 border-white/10 text-white flex flex-col justify-between">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                                <FileText className="w-5 h-5" />
                            </div>
                            <CardTitle className="text-base font-bold">
                                Erstantrag auf GdB
                            </CardTitle>
                        </div>

                        <CardDescription className="text-xs text-gray-400 pt-1">
                            Erstellen Sie ein Anschreiben zur Beantragung eines GdB beim
                            zuständigen Versorgungsamt.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-0">
                        <Button
                            onClick={() => router.push(`/${locale}/briefe?type=gdb-erstantrag`)}
                            className="w-full h-10 bg-[#20b2aa] hover:bg-[#3ddbd0] text-slate-950 font-bold text-xs rounded-xl shadow-md"
                        >
                            Formular generieren
                            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 text-white p-5 flex flex-col justify-between text-xs text-gray-400 space-y-2">
                    <div className="space-y-1">
                        <p className="font-bold text-white text-sm flex items-center gap-1.5">
                            <Shield className="w-4 h-4 text-gray-400" />
                            Verfahrens-Hinweise
                        </p>

                        <p className="pt-1">• Bearbeitungszeit: Kann je nach Versorgungsamt 3 bis 6 Monate dauern.</p>
                        <p className="pt-0.5">
                            • Rückwirkung: Ein GdB kann in Ausnahmefällen rückwirkend festgestellt werden
                            (wichtig für die Steuererklärung!).
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => window.open('https://www.gesetze-im-internet.org', '_blank')}
                        className="w-full h-10 border-white/10 text-white hover:bg-white/5 font-semibold text-xs rounded-xl"
                    >
                        Versorgungsmedizinische Grundsätze einsehen
                    </Button>
                </Card>
            </div>

            <div className="flex justify-center">
                <Button
                    variant="outline"
                    onClick={onReset}
                    className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5 h-11 px-6 rounded-xl"
                >
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Neue Einschätzung vornehmen
                </Button>
            </div>
        </>
    );
}