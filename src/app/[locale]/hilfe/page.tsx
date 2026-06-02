'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
    HelpCircle, ArrowRight, MessageCircle, FileText, Calculator, Users, Phone, Search, Lightbulb, ArrowLeft
} from 'lucide-react';

interface PageProps {
    params: Promise<{ locale: string }>;
}

const haeufigeFragen = [
    { frage: "Was ist ein Pflegegrad?", antwort: "Der Pflegegrad spiegelt den Grad der Selbstständigkeit einer Person wider. Das Spektrum reicht von Stufe 1 (geringe Beeinträchtigung) bis Stufe 5 (schwerste Beeinträchtigung)." },
    { frage: "Wie lange läuft das Antragsverfahren?", antwort: "Nach Eingang des Antrags muss die Kasse innerhalb von 25 Werktagen einen schriftlichen Bescheid erlassen. Bei Fristüberschreitung drohen Verzugsstrafen." },
    { frage: "Wie funktioniert der Widerspruch?", antwort: "Nach Erhalt des Ablehnungsbescheids läuft eine strikte Frist von einem Kalendermonat, in dem der Widerspruch schriftlich eingereicht werden muss." }
];

const themen = [
    { icon: Calculator, title: "Pflegegrad-Rechner", desc: "Prüfen Sie vorab Ihre Erfolgsaussichten", link: "/pflegegrad/start", color: "bg-[#20b2aa]" },
    { icon: FileText, title: "Widerspruchszentrum", desc: "Automatisierte Fristenwahrungen erstellen", link: "/widerspruch", color: "bg-amber-500" },
    { icon: Users, title: "Dienste & Netzwerke", desc: "Finden Sie ambulante Hilfe vor Ort", link: "/unterstuetzung", color: "bg-blue-500" },
];

export default function HilfePage(props: PageProps) {
    const router = useRouter();
    const params = use(props.params);
    const locale = params?.locale || 'de';
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const filteredFaqs = haeufigeFragen.filter(faq =>
        faq.frage.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.antwort.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <main className="min-h-screen bg-slate-900 text-white py-12 px-4 font-sans">
            <div className="container mx-auto max-w-3xl space-y-8">

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-500/10 border border-purple-500/30 rounded-2xl shadow-xl mb-4">
                        <HelpCircle className="w-10 h-10 text-purple-400" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Hilfe- & Wissenszentrum</h1>
                    <p className="text-sm text-gray-400 mt-1">SGB XI Direkt-Katalog, Fristregeln und digitale Beratung</p>
                </div>

                {/* Suchfeld */}
                <div className="relative max-w-xl mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input
                        type="text"
                        placeholder="Wissen durchsuchen (z.B. Widerspruch)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-12 bg-slate-950/50 border-white/10 text-white rounded-xl focus:border-purple-500"
                    />
                </div>

                {/* Kachel-Themen */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {themen.map((thema, i) => (
                        <Card key={i} className="bg-white/5 border-white/10 text-white hover:bg-white/10 cursor-pointer transition-all flex flex-col justify-between" onClick={() => router.push(`/${locale}${thema.link}`)}>
                            <CardHeader className="p-5 pb-3">
                                <div className={`w-10 h-10 ${thema.color} rounded-xl flex items-center justify-center mb-3 text-slate-950`}>
                                    <thema.icon className="w-5 h-5 text-white" />
                                </div>
                                <CardTitle className="text-base font-bold text-white">{thema.title}</CardTitle>
                                <CardDescription className="text-gray-400 text-xs mt-1">{thema.desc}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 pt-0">
                                <Button variant="link" className="text-[#20b2aa] p-0 text-xs flex items-center gap-1 hover:no-underline">
                                    Sektion öffnen <ArrowRight className="w-3 h-3" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* FAQs */}
                <div className="space-y-2">
                    <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-amber-400" /> Häufig gestellte Fragen</h2>
                    {filteredFaqs.map((faq, index) => (
                        <Card key={index} className="bg-white/5 border-white/10 text-white cursor-pointer hover:bg-white/[0.07] transition-all" onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}>
                            <CardHeader className="p-4">
                                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                                    <span>{faq.frage}</span>
                                    <span className="text-gray-500 font-mono">{expandedFaq === index ? '−' : '+'}</span>
                                </CardTitle>
                            </CardHeader>
                            {expandedFaq === index && (
                                <CardContent className="p-4 pt-0 text-xs text-gray-400 border-t border-white/5 bg-slate-950/20 leading-relaxed">
                                    {faq.antwort}
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>

                {/* Telefon-Hotline */}
                <Card className="bg-white/5 border-white/10 text-white">
                    <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center gap-2"><Phone className="w-4 h-4 text-emerald-400" /> Offizielle Bundes-Pflegehotline</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-2">
                        <p className="text-3xl font-extrabold text-emerald-400">030 20 45 28 28</p>
                        <p className="text-xs text-gray-400 mt-1">Montag bis Freitag von 09:00 bis 18:00 Uhr • Neutral & Gebührenfrei</p>
                    </CardContent>
                </Card>

                {/* Back Button */}
                <div className="flex justify-center pt-2">
                    <Button variant="ghost" onClick={() => router.push(`/${locale}`)} className="text-gray-400 hover:text-white hover:bg-white/5 h-11 px-6 rounded-xl">
                        <ArrowLeft className="mr-2 w-4 h-4" /> Zurück zur Startseite
                    </Button>
                </div>

            </div>
        </main>
    );
}