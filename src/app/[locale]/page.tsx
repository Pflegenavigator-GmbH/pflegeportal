// src/app/[locale]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Shield, Calculator, FileText, HelpCircle, ArrowRight, Clock, Users, Stethoscope, FolderOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";

export default function Startseite() {
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) || 'de';
    const [hatAktiveSession, setHatAktiveSession] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && localStorage.getItem('case_code')) {
            setHatAktiveSession(true);
        }
    }, []);

    const handlePflegegradKlick = () => {
        if (hatAktiveSession) {
            // 🚀 Automatische Übernahme: Schickt den Nutzer direkt zur bestehenden Analyse
            router.push(`/${locale}/pflegegrad/ergebnis`);
        } else {
            // Kaltstart: Trichter von vorne beginnen
            router.push(`/${locale}/pflegegrad/start`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 py-12 px-4">
            <div className="container mx-auto max-w-4xl">
                {/* Hero */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#20b2aa] to-[#3ddbd0] rounded-2xl shadow-2xl mb-6">
                        <Calculator className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        PflegeNavigator EU
                    </h1>
                    <p className="text-xl text-blue-200 max-w-2xl mx-auto">
                        Ihr Weg durch die Pflege - einfach, schnell, kostenlos
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-2 text-blue-300">
                        <Clock className="w-5 h-5" />
                        <span>Nur 15 Minuten statt 2-6 Wochen Wartezeit</span>
                    </div>
                </div>

                {/* 3 Haupt-Options-Karten */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all cursor-pointer group"
                        onClick={handlePflegegradKlick}
                    >
                        <CardHeader>
                            <div className="w-16 h-16 bg-[#20b2aa] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                {hatAktiveSession ? <FolderOpen className="w-8 h-8 text-white" /> : <Calculator className="w-8 h-8 text-white" />}
                            </div>
                            <CardTitle className="text-2xl text-white">
                                {hatAktiveSession ? 'Analyse ansehen' : 'Pflegegrad prüfen'}
                            </CardTitle>
                            <CardDescription className="text-blue-200">
                                {hatAktiveSession ? 'Sie haben eine aktive Analyse im Speicher.' : 'Finden Sie heraus, welcher Pflegegrad möglich ist.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full bg-[#20b2aa] hover:bg-[#3ddbd0] text-white">
                                {hatAktiveSession ? 'Zur Analyse' : 'Jetzt starten'} <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                            <p className="text-sm text-blue-300 mt-3">
                                {hatAktiveSession ? '✓ Laufende Session aktiv' : '✓ Kostenlos & anonym'}<br />
                                ✓ Nur 10 Minuten<br />
                                ✓ Mit Ergebnis-PDF
                            </p>
                        </CardContent>
                    </Card>

                    <Card
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all cursor-pointer group flex flex-col justify-between"
                        onClick={() => router.push(`/${locale}/widerspruch`)}
                    >
                        <div>
                            <CardHeader>
                                <div className="w-16 h-16 bg-amber-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <FileText className="w-8 h-8 text-white" />
                                </div>
                                <CardTitle className="text-2xl text-white">Widerspruch einlegen</CardTitle>
                                <CardDescription className="text-blue-200">
                                    Unzufrieden mit dem Bescheid?
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                                    Widerspruch schreiben <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                                <p className="text-sm text-blue-300 mt-3">
                                    ✓ Automatischer Brief<br />
                                    ✓ 1-Monats-Frist beachtet<br />
                                    ✓ Erfolgschancen prüfen
                                </p>
                            </CardContent>
                        </div>
                        {/* 🚀 NEU: Hyperlink zum Brief-Zentrum (Event Propagation gestoppt!) */}
                        <div className="p-4 mt-auto border-t border-white/10 text-center">
                            <a
                                href={`/${locale}/briefe`}
                                onClick={(e) => {
                                    e.stopPropagation(); // Verhindert den Klick der äußeren Card
                                    e.preventDefault();  // Verhindert Standard-Anker
                                    router.push(`/${locale}/briefe`); // Routet sanft via Next.js
                                }}
                                className="text-xs font-medium text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors relative z-10"
                            >
                                Oder: Zu allen Formular-Vorlagen
                            </a>
                        </div>
                    </Card>

                    <Card
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all cursor-pointer group"
                        onClick={() => router.push(`/${locale}/hilfe`)}
                    >
                        <CardHeader>
                            <div className="w-16 h-16 bg-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <HelpCircle className="w-8 h-8 text-white" />
                            </div>
                            <CardTitle className="text-2xl text-white">Ich weiß nicht</CardTitle>
                            <CardDescription className="text-blue-200">
                                Lassen Sie sich beraten
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white">
                                Hilfe finden <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                            <p className="text-sm text-blue-300 mt-3">
                                ✓ Avatar-Assistent<br />
                                ✓ Einfache Erklärungen<br />
                                ✓ Nächste Schritte
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* B2B Riegel */}
                <div className="mb-12">
                    <Card
                        className="bg-gradient-to-r from-white/10 to-white/5 border-white/20 text-white hover:bg-white/15 transition-all cursor-pointer group"
                        onClick={() => router.push(`/${locale}/pflegekraefte`)}
                    >
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#20b2aa] to-[#3ddbd0] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Stethoscope className="w-8 h-8 text-white" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-2xl text-white">Für Pflegekräfte & Pflegedienste</CardTitle>
                                    <CardDescription className="text-blue-200">
                                        Externe Tools wie PflegeGPT, Lastprofilvorhersage und mehr
                                    </CardDescription>
                                </div>
                                <ArrowRight className="w-6 h-6 text-[#20b2aa] group-hover:translate-x-1 transition-transform" />
                            </div>
                        </CardHeader>
                    </Card>
                </div>

                {/* Qualitatives Vertrauens-Register */}
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3 text-blue-200">
                        <Users className="w-6 h-6 text-[#20b2aa]" />
                        <span>4,9 Millionen Pflegebedürftige unterstützt</span>
                    </div>
                    <div className="flex items-center gap-3 text-blue-200">
                        <Shield className="w-6 h-6 text-[#20b2aa]" />
                        <span>Anonym & DSGVO-konform</span>
                    </div>
                    <div className="flex items-center gap-3 text-blue-200">
                        <Clock className="w-6 h-6 text-[#20b2aa]" />
                        <span>Sofortiges Ergebnis</span>
                    </div>
                </div>
            </div>
        </div>
    );
}