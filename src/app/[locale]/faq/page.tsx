'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    HelpCircle,
    Search,
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    MessageCircle,
    Phone,
    Mail
} from 'lucide-react';
import {Input} from "@/src/components/ui/input";
import {Tabs, TabsList, TabsTrigger} from "@/src/components/ui/tabs";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/src/components/ui/card";
import {Button} from "@/src/components/ui/button";

interface FAQ {
    id: string;
    frage: string;
    antwort: string;
    kategorie: string;
    haefigkeit: number; // 1-5, 5 = sehr häufig
}

const faqs: FAQ[] = [
    {
        id: '1',
        kategorie: 'pflegegrad',
        haefigkeit: 5,
        frage: 'Was ist ein Pflegegrad?',
        antwort: 'Der Pflegegrad ist ein Maß für den Pflegebedarf einer Person. Es gibt fünf Pflegegrade (1-5), wobei 1 der geringste und 5 der höchste Pflegebedarf ist. Der Pflegegrad wird vom Medizinischen Dienst (MDK) oder der Pflegekasse festgestellt. Die Einstufung bestimmt, welche Leistungen und wie viel Geld Sie erhalten.'
    },
    {
        id: '2',
        kategorie: 'pflegegrad',
        haefigkeit: 5,
        frage: 'Wie beantrage ich einen Pflegegrad?',
        antwort: 'Sie beantragen den Pflegegrad bei Ihrer Pflegekasse. Nutzen Sie unseren Pflegegrad-Check, um vorab zu prüfen, welcher Grad wahrscheinlich ist. Nach dem Antrag kommt ein Gutachter vom MDK zu Ihnen nach Hause und bewertet Ihren Pflegebedarf anhand der sechs Module der Neuausrichtung der Pflegebedürftigkeit (NBA).'
    },
    {
        id: '3',
        kategorie: 'pflegegrad',
        haefigkeit: 4,
        frage: 'Wie lange dauert es, bis ich den Bescheid bekomme?',
        antwort: 'Nach dem Antrag haben Sie Anspruch auf einen Bescheid innerhalb von 5 Wochen (25 Werktage). Dies ist gesetzlich geregelt. Wenn Sie länger warten müssen, können Sie eine Verzugszulage beantragen. Nutzen Sie unseren Briefgenerator für das Anschreiben an die Pflegekasse.'
    },
    {
        id: '4',
        kategorie: 'pflegegrad',
        haefigkeit: 5,
        frage: 'Was sind die sechs Module der NBA?',
        antwort: 'Die NBA (Neuausrichtung der Pflegebedürftigkeit) bewertet sechs Lebensbereiche: 1) Mobilität, 2) Körperpflege, 3) Ernährung, 4) Ausscheidung, 5) hauswirtschaftliche Versorgung, 6) Behandlungspflege/cognitive Leistungen. Je nachdem, in wie vielen Bereichen Sie Unterstützung brauchen, wird Ihr Pflegegrad berechnet.'
    },
    {
        id: '5',
        kategorie: 'widerspruch',
        haefigkeit: 5,
        frage: 'Mein Pflegegrad wurde abgelehnt – was nun?',
        antwort: 'Sie können Widerspruch einlegen! Sie haben 1 Monat Zeit ab Erhalt des Bescheids. Nutzen Sie unseren Widerspruchsgenerator, um einen vollständigen Widerspruchsbrief zu erstellen. Wichtig: Begründen Sie, warum Sie der Meinung sind, dass der Pflegegrad zu niedrig ist. Ein Arztbrief oder Pflegebericht kann helfen.'
    },
    {
        id: '6',
        kategorie: 'widerspruch',
        haefigkeit: 4,
        frage: 'Wie erfolgreich sind Widersprüche?',
        antwort: 'Etwa 40-50% der Widersprüche gegen Pflegegrad-Bescheide sind erfolgreich. Das bedeutet: Es lohnt sich, Widerspruch einzulegen! Viele Menschen bekommen nach dem Widerspruch einen höheren Pflegegrad oder überhaupt erst einen Pflegegrad zuerkannt.'
    },
    {
        id: '7',
        kategorie: 'leistungen',
        haefigkeit: 4,
        frage: 'Was kriege ich bei Pflegegrad 2?',
        antwort: 'Bei Pflegegrad 2 haben Sie Anspruch auf: Pflegegeld (bis zu 573 €/Monat bei Selbstpflege), Pflegesachleistungen (bis zu 1.146 €/Monat für Pflegedienste), oder eine Kombination aus beidem. Außerdem: Entlastungsbetrag (194 €/Monat), Pflegehilfsmittel, Wohnumfeldverbesserungen, und Kurzzeitpflege.'
    },
    {
        id: '8',
        kategorie: 'leistungen',
        haefigkeit: 4,
        frage: 'Was ist der Unterschied zwischen Pflegegeld und Sachleistungen?',
        antwort: 'Pflegegeld erhalten Sie direkt ausgezahlt, wenn Angehörige Sie pflegen. Sachleistungen werden direkt an Pflegedienste gezahlt, die Sie pflegen. Sie können beides kombinieren: z.B. 50% Pflegegeld + 50% Sachleistungen. Das Pflegegeld ist steuerfrei.'
    },
    {
        id: '9',
        kategorie: 'geld',
        haefigkeit: 5,
        frage: 'Muss ich das Pflegegeld versteuern?',
        antwort: 'Nein! Pflegegeld ist steuerfrei. Es zählt weder als Einkommen noch als Vermögen. Sie dürfen es behalten, auch wenn Sie Sozialleistungen wie Bürgergeld oder Wohngeld bekommen. Das macht das Pflegegeld besonders wertvoll für pflegende Angehörige.'
    },
    {
        id: '10',
        kategorie: 'migration',
        haefigkeit: 5,
        frage: 'Kann ich als Migrant/in auch einen Pflegegrad beantragen?',
        antwort: 'Ja, absolut! Ihr Migrationshintergrund spielt keine Rolle. Entscheidend ist der Pflegebedarf. Das Portal ist in 35 Sprachen verfügbar, und wir helfen Ihnen bei allen Fragen. Sie haben dieselben Rechte wie alle anderen versicherten Personen in Deutschland.'
    },
    {
        id: '11',
        kategorie: 'migration',
        haefigkeit: 4,
        frage: 'Mein Deutsch ist nicht gut – kann ich trotzdem einen Antrag stellen?',
        antwort: 'Ja! Sie können bei der Pflegekasse um einen Dolmetscher bitten – kostenlos. Oder Sie lassen sich von einer Vertrauensperson begleiten. Unser Portal ist mehrsprachig und erklärt alle Schritte einfach. Wir empfehlen: Nehmen Sie jemanden zum Gespräch mit, der Ihnen hilft.'
    },
    {
        id: '12',
        kategorie: 'technik',
        haefigkeit: 3,
        frage: 'Ist die Nutzung des Portals kostenlos?',
        antwort: 'Ja, vollständig kostenlos! PflegeNavigator EU ist ein gemeinnütziges Angebot. Wir finanzieren uns durch Spenden und Fördermittel. Es gibt keine versteckten Kosten, keine Registrierungspflicht, keine Werbung. Alle Briefe, Berechnungen und Informationen sind gratis.'
    },
    {
        id: '13',
        kategorie: 'technik',
        haefigkeit: 3,
        frage: 'Brauche ich ein Benutzerkonto?',
        antwort: 'Nein. Sie können alle Funktionen ohne Anmeldung nutzen. Ihre Daten werden lokal in Ihrem Browser gespeichert (wenn Sie das möchten). Wir speichern keine persönlichen Daten auf unseren Servern. Das macht das Portal besonders datenschutzfreundlich.'
    },
    {
        id: '14',
        kategorie: 'recht',
        haefigkeit: 3,
        frage: 'Ist PflegeNavigator EU eine Rechtsberatung?',
        antwort: 'Nein. Wir bieten Orientierungshilfen und Informationen, aber keine verbindliche Rechtsberatung. Für verbindliche Entscheidungen sind die zuständigen Stellen (MDK, Pflegekassen, Sozialgerichte) zuständig. Bei komplexen Fällen empfehlen wir eine Beratung beim Pflegestützpunkt oder einer Rechtsberatungsstelle.'
    },
    {
        id: '15',
        kategorie: 'recht',
        haefigkeit: 4,
        frage: 'Was ist eine Betreuungsverfügung?',
        antwort: 'Eine Betreuungsverfügung legt fest, wer für Sie entscheidet, wenn Sie selbst nicht mehr können. Das betrifft z.B. medizinische Entscheidungen oder Pflegefragen. Sie können die Verfügung selbst erstellen und bei einer Betreuungsbehörde hinterlegen. Wir bieten Muster-Dokumente zum Download an.'
    }
];

const kategorien = [
    { id: 'alle', name: 'Alle Fragen' },
    { id: 'pflegegrad', name: 'Pflegegrad' },
    { id: 'widerspruch', name: 'Widerspruch' },
    { id: 'leistungen', name: 'Leistungen' },
    { id: 'geld', name: 'Geld & Steuern' },
    { id: 'migration', name: 'Migration' },
    { id: 'recht', name: 'Rechtliches' },
    { id: 'technik', name: 'Technik' }
];

export default function FAQPage() {
    const router = useRouter();
    const [suchbegriff, setSuchbegriff] = useState('');
    const [geoeffneteFrage, setGeoeffneteFrage] = useState<string | null>(null);
    const [aktiveKategorie, setAktiveKategorie] = useState('alle');

    const gefilterteFAQs = faqs.filter(faq => {
        const passtKategorie = aktiveKategorie === 'alle' || faq.kategorie === aktiveKategorie;
        const passtSuche = suchbegriff === '' ||
            faq.frage.toLowerCase().includes(suchbegriff.toLowerCase()) ||
            faq.antwort.toLowerCase().includes(suchbegriff.toLowerCase());
        return passtKategorie && passtSuche;
    });

    // Sortiere nach Häufigkeit (beliebteste zuerst)
    const sortierteFAQs = [...gefilterteFAQs].sort((a, b) => b.haefigkeit - a.haefigkeit);

    const toggleFrage = (id: string) => {
        setGeoeffneteFrage(geoeffneteFrage === id ? null : id);
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#20b2aa] to-[#3ddbd0] rounded-2xl shadow-xl mb-6">
                        <HelpCircle className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-[#0f2744] mb-4">
                        Häufig gestellte Fragen
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Schnelle Antworten auf die wichtigsten Fragen rund um Pflege
                    </p>
                </div>

                {/* Suchleiste */}
                <div className="mb-8">
                    <div className="relative max-w-2xl mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Fragen durchsuchen..."
                            value={suchbegriff}
                            onChange={(e) => setSuchbegriff(e.target.value)}
                            className="pl-14 py-6 text-lg rounded-2xl border-2 border-slate-200 focus:border-[#20b2aa]"
                        />
                    </div>
                </div>

                {/* Kategorie-Tabs */}
                <Tabs value={aktiveKategorie} onValueChange={setAktiveKategorie} className="mb-10">
                    <TabsList className="flex flex-wrap justify-center h-auto gap-2 bg-transparent">
                        {kategorien.map((kat) => (
                            <TabsTrigger
                                key={kat.id}
                                value={kat.id}
                                className="data-[state=active]:bg-[#20b2aa] data-[state=active]:text-white px-4 py-2"
                            >
                                {kat.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                {/* FAQ-Liste */}
                <div className="space-y-4 mb-12">
                    {sortierteFAQs.map((faq) => (
                        <Card
                            key={faq.id}
                            className={`transition-all duration-200 ${
                                geoeffneteFrage === faq.id ? 'ring-2 ring-[#20b2aa]' : 'hover:shadow-md'
                            }`}
                        >
                            <div
                                className="p-6 cursor-pointer"
                                onClick={() => toggleFrage(faq.id)}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            {faq.haefigkeit >= 4 && (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          Beliebt
                        </span>
                                            )}
                                            <span className="text-xs text-slate-400 capitalize">
                        {kategorien.find(k => k.id === faq.kategorie)?.name}
                      </span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-[#0f2744] pr-8">
                                            {faq.frage}
                                        </h3>
                                    </div>
                                    <div className="flex-shrink-0">
                                        {geoeffneteFrage === faq.id ? (
                                            <ChevronUp className="w-6 h-6 text-[#20b2aa]" />
                                        ) : (
                                            <ChevronDown className="w-6 h-6 text-slate-400" />
                                        )}
                                    </div>
                                </div>

                                {geoeffneteFrage === faq.id && (
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <p className="text-slate-600 leading-relaxed">
                                            {faq.antwort}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Keine Ergebnisse */}
                {sortierteFAQs.length === 0 && (
                    <Card className="text-center py-12">
                        <HelpCircle className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-600 mb-2">
                            Keine Fragen gefunden
                        </h3>
                        <p className="text-slate-500 mb-6">
                            Versuchen Sie es mit einem anderen Suchbegriff
                        </p>
                        <Button variant="outline" onClick={() => {setSuchbegriff(''); setAktiveKategorie('alle');}}>
                            Alle Fragen anzeigen
                        </Button>
                    </Card>
                )}

                {/* Weitere Hilfe */}
                <Card className="bg-[#0f2744] text-white">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <MessageCircle className="w-6 h-6" />
                            Haben Sie weitere Fragen?
                        </CardTitle>
                        <CardDescription className="text-blue-200">
                            Wir helfen Ihnen persönlich weiter
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-[#20b2aa] rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">E-Mail</h3>
                                    <p className="text-blue-200 text-sm">
                                        info@pflegenavigatoreu.com
                                    </p>
                                    <p className="text-blue-300 text-xs mt-1">
                                        Antwort innerhalb 24h
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-[#20b2aa] rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Phone className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Pflegehotline</h3>
                                    <p className="text-blue-200 text-sm">
                                        030 20 45 28 28
                                    </p>
                                    <p className="text-blue-300 text-xs mt-1">
                                        Mo-Fr: 9-18 Uhr
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <footer className="mt-12 pt-6 border-t text-center">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/')}
                        size="lg"
                    >
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        Zurück zur Startseite
                    </Button>
                </footer>
            </div>
        </main>
    );
}
