// src/components/legal/CookieBanner.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/src/components/ui/button";
import { Check, ChevronDown, ChevronUp, Info, ShieldCheck } from 'lucide-react';

interface ConsentState {
    essential: boolean; // Immer true
    analytics: boolean;
    marketing: boolean;
}

export function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [consents, setConsents] = useState<ConsentState>({
        essential: true,
        analytics: false,
        marketing: false
    });

    useEffect(() => {
        // Prüfen, ob der User schon gewählt hat
        const storedConsent = localStorage.getItem('user_consent');
        if (!storedConsent) {
            setIsVisible(true);
        }
    }, []);

    const saveConsent = (newConsents: ConsentState) => {
        localStorage.setItem('user_consent', JSON.stringify(newConsents));
        setIsVisible(false);

        // Hier feuern wir ein Event, damit andere Skripte (Analytics etc.)
        // sofort wissen, dass sie jetzt laden dürfen
        window.dispatchEvent(new CustomEvent('consentChange', { detail: newConsents }));
    };

    const handleAcceptAll = () => {
        saveConsent({ essential: true, analytics: true, marketing: true });
    };

    const handleAcceptEssential = () => {
        saveConsent({ essential: true, analytics: false, marketing: false });
    };

    const handleSaveCustom = () => {
        saveConsent(consents);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 pointer-events-none flex justify-center">
            <div className="bg-[#0f2744] border border-white/10 shadow-2xl rounded-2xl w-full max-w-4xl p-6 pointer-events-auto text-white flex flex-col gap-6">

                <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#20b2aa]/20 rounded-xl hidden sm:block">
                        <ShieldCheck className="w-8 h-8 text-[#20b2aa]" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-2">Ihre Privatsphäre ist uns wichtig</h3>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            Wir verwenden Cookies, um Ihnen die bestmögliche Nutzung unserer Plattform zu ermöglichen. Da wir sensible Daten verarbeiten, setzen wir standardmäßig nur technisch essenzielle Cookies. Für die anonyme Auswertung zur Verbesserung unseres Services benötigen wir Ihre Zustimmung.
                        </p>
                    </div>
                </div>

                {showDetails && (
                    <div className="space-y-4 bg-slate-950/50 p-4 rounded-xl border border-white/5">
                        {/* Essenziell */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold text-sm text-white">Technisch notwendig</p>
                                <p className="text-xs text-gray-400">Speichert Ihre Fallnummer und Spracheinstellungen.</p>
                            </div>
                            <Check className="w-5 h-5 text-gray-500" />
                        </div>

                        {/* Analytics */}
                        <div className="flex items-center justify-between border-t border-white/5 pt-4">
                            <div>
                                <p className="font-bold text-sm text-white">Analyse & Statistik</p>
                                <p className="text-xs text-gray-400">Anonyme Daten darüber, wie die App genutzt wird.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={consents.analytics}
                                onChange={(e) => setConsents({...consents, analytics: e.target.checked})}
                                className="w-5 h-5 accent-[#20b2aa]"
                            />
                        </div>

                        {/* Marketing */}
                        <div className="flex items-center justify-between border-t border-white/5 pt-4">
                            <div>
                                <p className="font-bold text-sm text-white">Externe Medien & Marketing</p>
                                <p className="text-xs text-gray-400">Wird für externe Inhalte und Zahlungsanbieter-Tracking benötigt.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={consents.marketing}
                                onChange={(e) => setConsents({...consents, marketing: e.target.checked})}
                                className="w-5 h-5 accent-[#20b2aa]"
                            />
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                        {showDetails ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                        {showDetails ? "Weniger Details" : "Einstellungen anpassen"}
                    </button>

                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            onClick={showDetails ? handleSaveCustom : handleAcceptEssential}
                            className="bg-transparent border-white/20 text-white hover:bg-white/5"
                        >
                            {showDetails ? "Auswahl speichern" : "Nur Essenzielle"}
                        </Button>
                        <Button
                            onClick={handleAcceptAll}
                            className="bg-[#20b2aa] hover:bg-[#3ddbd0] text-slate-950 font-bold"
                        >
                            Alle akzeptieren
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
}