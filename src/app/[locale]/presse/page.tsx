'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Newspaper, ArrowRight, ArrowLeft, Search, Calendar, ExternalLink, FileText, Download, Mail, Globe } from 'lucide-react';

interface PageProps {
    params: Promise<{ locale: string }>;
}

const beispielMeldungen = [
    { id: 1, datum: "27. April 2026", titel: "PflegeNavigator EU startet Beta-Phase", unterzeile: "Neues Portal macht Pflegegrad-Rechner für alle zugänglich", kategorie: "Produktlaunch", zusammenfassung: "Das Portal bietet kostenlose Pflegegrad-Berechnung, Widerspruchs-Generatoren und 35 Sprachen." },
    { id: 2, datum: "15. April 2026", titel: "Pflegereform 2026: Was ändert sich wirklich?", unterzeile: "Analyse der neuen BEEP-Gesetze für Pflegebedürftige", kategorie: "Recht", zusammenfassung: "Kürzere Abrechnungsfristen, weniger Bürokratie, mehr digitale Angebote." }
];

const kategorien = ["Alle", "Produktlaunch", "Recht", "Kooperation", "Statistik", "Migration"];

export default function PresseportalPage(props: PageProps) {
    const router = useRouter();
    const params = use(props.params);
    const locale = params?.locale || 'de';

    const [suchbegriff, setSuchbegriff] = useState('');
    const [aktiveKategorie, setAktiveKategorie] = useState('Alle');

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4 text-slate-900">
            <div className="container mx-auto max-w-4xl">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-[#0f2744] rounded-2xl shadow-xl mb-6">
                        <Newspaper className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-[#0f2744] mb-4">Presseportal & Blog</h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">Aktuelle Informationen, Pressemitteilungen und Medienmaterialien</p>
                </div>

                {/* ... Hier verbleibt der Rest deines exzellent gestalteten Presse-UI Codes ... */}

                <footer className="mt-12 pt-6 border-t text-center">
                    <Button variant="outline" onClick={() => router.push(`/${locale}`)} size="lg" className="border-slate-300">
                        <ArrowLeft className="mr-2 w-4 h-4" /> Zurück zur Startseite
                    </Button>
                </footer>
            </div>
        </main>
    );
}