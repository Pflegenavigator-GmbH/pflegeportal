// src/app/[locale]/em-rente/page.tsx
'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import {
    Briefcase,
    Calculator,
    ArrowRight,
    ArrowLeft,
    Euro,
    Info,
    FileText,
    CheckCircle,
    AlertTriangle,
    Clock,
    Shield,
    Heart
} from 'lucide-react';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ locale: string }>;
}

interface EmRenteErgebnis {
    renteBetrag: number;
    zulageBetrag: number;
    gesamtBetrag: number;
    pflegegrad: number;
    qualifiziert: boolean;
}

export default function EmRenteRechner(props: PageProps) {
    const router = useRouter();
    const params = use(props.params);
    const locale = params?.locale || 'de';

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        geburtsjahr: '',
        eintrittsdatum: '',
        pflegegrad: '',
        arbeitsjahre: '',
        durchschnittsgehalt: ''
    });
    const [ergebnis, setErgebnis] = useState<EmRenteErgebnis | null>(null);

    const berechneEmRente = () => {
        // Vereinfachte Berechnung basierend auf Eckdaten der DRV (Stand 2026)
        const pflegegrad = parseInt(formData.pflegegrad) || 0;
        const arbeitsjahre = parseInt(formData.arbeitsjahre) || 0;
        const gehalt = parseFloat(formData.durchschnittsgehalt) || 0;

        // Durchschnittsentgelt (ca. 45.358 € Referenzwert)
        const rentenpunkte = Math.min(arbeitsjahre * (gehalt / 45358), 45); // Max 45 Punkte gekappt
        const aktuellerRentenwert = 39.32; // Prognosewert

        const renteBasis = rentenpunkte * aktuellerRentenwert;

        // Pflege-Personal-Zulage
        const pflegeZulagen: Record<number, number> = {
            1: 0,
            2: 0,
            3: 201.06,
            4: 302.65,
            5: 403.53
        };

        const zulage = pflegeZulagen[pflegegrad] || 0;

        // Grobe Qualifikation: Mindestens Pflegegrad 3 oder 5+ Jahre gearbeitet
        const qualifiziert = pflegegrad >= 3 || (pflegegrad >= 1 && arbeitsjahre >= 5);

        setErgebnis({
            renteBetrag: Math.round(renteBasis * 100) / 100,
            zulageBetrag: zulage,
            gesamtBetrag: Math.round((renteBasis + zulage) * 100) / 100,
            pflegegrad,
            qualifiziert
        });
        setStep(4);
    };

    const isStep1Valid = formData.geburtsjahr.length === 4 && formData.eintrittsdatum;
    const isStep2Valid = formData.pflegegrad !== '';
    const isStep3Valid = formData.arbeitsjahre && formData.durchschnittsgehalt;

    return (
        <main className="min-h-screen bg-slate-900 text-white font-sans py-12 px-4">
            <div className="container mx-auto max-w-3xl space-y-8">

                {/* Header */}
                <div className="text-center space-y-3 mb-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#0f2744] to-[#20b2aa] border border-white/10 rounded-2xl shadow-xl">
                        <Briefcase className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                        EM-Rente & Pflegezulage
                    </h1>
                    <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
                        Schätzen Sie Ihre mögliche Erwerbsminderungsrente inklusive gesetzlicher Pflegezulagen ab.
                    </p>
                </div>

                {/* Info-Box (nur in Schritt 1-3) */}
                {step < 4 && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                            <strong>Wussten Sie schon?</strong> Die Erwerbsminderungsrente kann bei vorliegender Pflegebedürftigkeit (ab Pflegegrad 3) deutlich erhöht werden. Diese Pflege-Personal-Zulage wird <em>zusätzlich</em> zur Rente gezahlt.
                        </div>
                    </div>
                )}

                {/* Step 1: Grunddaten */}
                {step === 1 && (
                    <Card className="bg-white/5 border-white/10 shadow-xl">
                        <CardHeader className="border-b border-white/5 pb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full flex items-center justify-center font-bold">
                                    1
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-white">Biometrische Grunddaten</CardTitle>
                                    <CardDescription className="text-gray-400 text-xs mt-1">Für die Altersgrenzen-Berechnung</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="geburtsjahr" className="text-xs text-gray-300">Geburtsjahr</Label>
                                    <Input
                                        id="geburtsjahr"
                                        type="number"
                                        placeholder="z.B. 1965"
                                        className="bg-slate-950/50 border-white/10 h-11 text-white"
                                        value={formData.geburtsjahr}
                                        onChange={(e) => setFormData({...formData, geburtsjahr: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="eintrittsdatum" className="text-xs text-gray-300">Beginn der Einschränkung</Label>
                                    <Input
                                        id="eintrittsdatum"
                                        type="date"
                                        className="bg-slate-950/50 border-white/10 h-11 text-white"
                                        value={formData.eintrittsdatum}
                                        onChange={(e) => setFormData({...formData, eintrittsdatum: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button onClick={() => setStep(2)} disabled={!isStep1Valid} className="h-11 bg-[#20b2aa] hover:bg-[#3ddbd0] text-slate-950 font-bold px-8 rounded-xl disabled:opacity-50">
                                    Weiter <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Pflegebedürftigkeit */}
                {step === 2 && (
                    <Card className="bg-white/5 border-white/10 shadow-xl">
                        <CardHeader className="border-b border-white/5 pb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[#20b2aa]/20 text-[#20b2aa] border border-[#20b2aa]/30 rounded-full flex items-center justify-center font-bold">
                                    2
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-white">Pflege-Status</CardTitle>
                                    <CardDescription className="text-gray-400 text-xs mt-1">Ermittlung der Zulagen-Ansprüche</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="space-y-2 max-w-md">
                                <Label htmlFor="pflegegrad" className="text-xs text-gray-300">Aktueller Pflegegrad</Label>
                                <select
                                    id="pflegegrad"
                                    className="w-full bg-slate-950/50 border border-white/10 h-11 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-[#20b2aa]"
                                    value={formData.pflegegrad}
                                    onChange={(e) => setFormData({...formData, pflegegrad: e.target.value})}
                                >
                                    <option value="" className="text-gray-500">Bitte auswählen...</option>
                                    <option value="0">Noch kein Pflegegrad</option>
                                    <option value="1">Pflegegrad 1</option>
                                    <option value="2">Pflegegrad 2</option>
                                    <option value="3">Pflegegrad 3</option>
                                    <option value="4">Pflegegrad 4</option>
                                    <option value="5">Pflegegrad 5</option>
                                </select>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3">
                                <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs sm:text-sm text-amber-200/80 leading-relaxed">
                                    <strong>Wichtig:</strong> Die gesetzliche Pflege-Zulage zur EM-Rente wird grundsätzlich erst ab Pflegegrad 3 gewährt. Bei niedrigeren Graden gelten strenge Sonderregelungen.
                                </p>
                            </div>

                            <div className="flex justify-between pt-2">
                                <Button variant="outline" onClick={() => setStep(1)} className="h-11 border-white/10 text-white hover:bg-white/5 px-6 rounded-xl">
                                    <ArrowLeft className="mr-2 w-4 h-4" /> Zurück
                                </Button>
                                <Button onClick={() => setStep(3)} disabled={!isStep2Valid} className="h-11 bg-[#20b2aa] hover:bg-[#3ddbd0] text-slate-950 font-bold px-8 rounded-xl disabled:opacity-50">
                                    Weiter <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Berufsdaten */}
                {step === 3 && (
                    <Card className="bg-white/5 border-white/10 shadow-xl">
                        <CardHeader className="border-b border-white/5 pb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full flex items-center justify-center font-bold">
                                    3
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-white">Berufliche Renten-Historie</CardTitle>
                                    <CardDescription className="text-gray-400 text-xs mt-1">Grundlage für die Punkte-Kalkulation</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="arbeitsjahre" className="text-xs text-gray-300">Beitragsjahre (geschätzt)</Label>
                                    <Input
                                        id="arbeitsjahre"
                                        type="number"
                                        placeholder="z.B. 25"
                                        className="bg-slate-950/50 border-white/10 h-11 text-white"
                                        value={formData.arbeitsjahre}
                                        onChange={(e) => setFormData({...formData, arbeitsjahre: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="durchschnittsgehalt" className="text-xs text-gray-300">Durchschnittliches Brutto-Jahresgehalt</Label>
                                    <div className="relative">
                                        <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <Input
                                            id="durchschnittsgehalt"
                                            type="number"
                                            className="pl-10 bg-slate-950/50 border-white/10 h-11 text-white"
                                            placeholder="z.B. 45000"
                                            value={formData.durchschnittsgehalt}
                                            onChange={(e) => setFormData({...formData, durchschnittsgehalt: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-950/40 p-4 border border-white/5 rounded-xl text-xs text-gray-400">
                                <strong>Hinweis zur Berechnung:</strong> Die tatsächliche Rentenhöhe hängt von komplexen Faktoren (Zurechnungszeiten, Abschläge) ab. Dies ist ein Referenzwert für Ihre private Vorplanung.
                            </div>

                            <div className="flex justify-between pt-2">
                                <Button variant="outline" onClick={() => setStep(2)} className="h-11 border-white/10 text-white hover:bg-white/5 px-6 rounded-xl">
                                    <ArrowLeft className="mr-2 w-4 h-4" /> Zurück
                                </Button>
                                <Button onClick={berechneEmRente} disabled={!isStep3Valid} className="h-11 bg-[#20b2aa] hover:bg-[#3ddbd0] text-slate-950 font-bold px-8 rounded-xl disabled:opacity-50">
                                    <Calculator className="mr-2 w-4 h-4" /> Kalkulieren
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 4: Ergebnis */}
                {step === 4 && ergebnis && (
                    <div className="space-y-6">
                        <Card className="bg-white/5 border-[#20b2aa]/30 shadow-2xl overflow-hidden">
                            <div className="p-6 sm:p-8 bg-gradient-to-br from-[#20b2aa]/10 to-transparent">
                                <div className="flex items-center gap-3 mb-6">
                                    <Calculator className="w-6 h-6 text-[#20b2aa]" />
                                    <CardTitle className="text-xl text-white">Ihr Projektions-Ergebnis</CardTitle>
                                </div>

                                {ergebnis.qualifiziert ? (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-3 mb-6">
                                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                        <span className="text-sm font-medium">Ihre Eckdaten weisen auf eine hohe Qualifikations-Chance für die Rente hin!</span>
                                    </div>
                                ) : (
                                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex items-start gap-3 mb-6">
                                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm">Sie erfüllen die harten Beitrags- oder Pflege-Kriterien eventuell noch nicht vollständig. Eine Detailprüfung durch die DRV ist angeraten.</span>
                                    </div>
                                )}

                                <div className="grid sm:grid-cols-3 gap-4">
                                    <div className="bg-slate-950/40 border border-white/5 rounded-xl p-5 text-center">
                                        <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Basis-EM-Rente</p>
                                        <p className="text-2xl font-bold text-white">
                                            {ergebnis.renteBetrag.toLocaleString('de-DE')} €
                                        </p>
                                    </div>
                                    <div className="bg-slate-950/40 border border-white/5 rounded-xl p-5 text-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-blue-500/5" />
                                        <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide relative z-10">Pflege-Zulage</p>
                                        <p className="text-2xl font-bold text-blue-400 relative z-10">
                                            + {ergebnis.zulageBetrag.toLocaleString('de-DE')} €
                                        </p>
                                    </div>
                                    <div className="bg-[#20b2aa]/20 border border-[#20b2aa]/30 rounded-xl p-5 text-center">
                                        <p className="text-xs text-[#20b2aa] mb-2 font-bold uppercase tracking-wide">Gesamt (geschätzt)</p>
                                        <p className="text-3xl font-extrabold text-white">
                                            {ergebnis.gesamtBetrag.toLocaleString('de-DE')} €
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs mt-6">
                                    <Clock className="w-4 h-4" />
                                    <span>Monatliche Renten-Auszahlung (12x im Jahr)</span>
                                </div>
                            </div>
                        </Card>

                        {/* B2B / Action Cards */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <Card className="bg-white/5 border-white/10 text-white hover:bg-white/[0.07] transition-colors cursor-pointer group" onClick={() => router.push(`/${locale}/briefe`)}>
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">Offiziellen Antrag erstellen</CardTitle>
                                            <CardDescription className="text-gray-400 text-xs mt-1">Im Brief-Zentrum generieren</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Button className="w-full bg-[#20b2aa] hover:bg-[#3ddbd0] text-slate-950 font-bold rounded-xl h-10 text-xs">
                                        Zum Brief-Generator <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="bg-white/5 border-white/10 text-white">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                                            <Heart className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">Fachliche Beratung</CardTitle>
                                            <CardDescription className="text-gray-400 text-xs mt-1">Deutsche Rentenversicherung</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5 rounded-xl h-10 text-xs" onClick={() => window.open('https://www.deutsche-rentenversicherung.de', '_blank')}>
                                        Zur DRV-Webseite <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex justify-center pt-4">
                            <Button variant="ghost" onClick={() => { setStep(1); setErgebnis(null); }} className="text-gray-400 hover:text-white hover:bg-white/5 px-6 rounded-xl">
                                <ArrowLeft className="mr-2 w-4 h-4" /> Neue Projektion starten
                            </Button>
                        </div>
                    </div>
                )}

                {/* Footer Disclaimer */}
                <footer className="mt-12 pt-6 border-t border-white/10 text-center">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-gray-500 text-xs max-w-2xl mx-auto leading-relaxed">
                        <Shield className="w-4 h-4 flex-shrink-0" />
                        <p>
                            Dies ist eine unverbindliche mathematische Schätzung. Die rechtsverbindliche Rentenhöhe und der Anspruch werden ausschließlich von der Deutschen Rentenversicherung nach ärztlicher Begutachtung festgestellt.
                        </p>
                    </div>
                </footer>

            </div>
        </main>
    );
}