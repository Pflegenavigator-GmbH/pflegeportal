// src/components/legal/CookieBanner.tsx
'use client';

import { Check, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { useEffect, useId, useState, useSyncExternalStore } from 'react';

import { Button } from '@/src/components/ui';
import { useConsent } from '@/src/hooks/useConsent';
import {
  EINWILLIGUNG_OEFFNEN_EVENT,
  NUR_ESSENZIELL,
  speichereEinwilligung,
  type Einwilligung,
} from '@/src/lib/consent';

/**
 * Erkennt, ob die Hydratation durch ist.
 *
 * Der Banner darf serverseitig nicht gerendert werden: dort ist der
 * Speicher unbekannt, und wer längst zugestimmt hat, sähe ihn sonst bei
 * jedem Seitenaufruf kurz aufblitzen. Ein no-op-Abonnement mit
 * unterschiedlichem Server-/Client-Snapshot löst das ohne setState im Effekt.
 */
function useIstHydriert(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function CookieBanner() {
  const [showDetails, setShowDetails] = useState(false);
  const [erneutGeoeffnet, setErneutGeoeffnet] = useState(false);
  const [consents, setConsents] = useState<Einwilligung>(NUR_ESSENZIELL);

  const istHydriert = useIstHydriert();
  const { einwilligung, hatEntschieden } = useConsent();

  const titelId = useId();
  const beschreibungId = useId();
  const analyticsId = useId();
  const marketingId = useId();

  // Widerruf: ein Einstiegspunkt (Footer, Datenschutzseite) öffnet die Auswahl
  // erneut — mit der bisherigen Wahl vorbelegt, damit sichtbar ist, was gilt.
  useEffect(() => {
    const oeffnen = () => {
      setConsents(einwilligung ?? NUR_ESSENZIELL);
      setShowDetails(true);
      setErneutGeoeffnet(true);
    };

    window.addEventListener(EINWILLIGUNG_OEFFNEN_EVENT, oeffnen);
    return () => window.removeEventListener(EINWILLIGUNG_OEFFNEN_EVENT, oeffnen);
  }, [einwilligung]);

  const speichern = (auswahl: Einwilligung) => {
    speichereEinwilligung(auswahl);
    setErneutGeoeffnet(false);
    setShowDetails(false);
  };

  if (!istHydriert) return null;
  if (hatEntschieden && !erneutGeoeffnet) return null;

  return (
    <div
      role="dialog"
      aria-labelledby={titelId}
      aria-describedby={beschreibungId}
      className="fixed bottom-0 left-0 right-0 z-[100] p-4 pointer-events-none flex justify-center"
    >
      <div className="bg-[#0f2744] border border-white/10 shadow-2xl rounded-2xl w-full max-w-4xl p-6 pointer-events-auto text-white flex flex-col gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#20b2aa]/20 rounded-xl hidden sm:block">
            <ShieldCheck className="w-8 h-8 text-[#20b2aa]" aria-hidden="true" />
          </div>
          <div>
            <h2 id={titelId} className="text-xl font-bold mb-2">
              {erneutGeoeffnet ? 'Ihre Cookie-Einstellungen' : 'Ihre Privatsphäre ist uns wichtig'}
            </h2>
            <p id={beschreibungId} className="text-sm text-gray-300 leading-relaxed">
              Wir verwenden Cookies, um Ihnen die bestmögliche Nutzung unserer Plattform zu
              ermöglichen. Da wir sensible Daten verarbeiten, setzen wir standardmäßig nur technisch
              essenzielle Cookies. Für die anonyme Auswertung zur Verbesserung unseres Services
              benötigen wir Ihre Zustimmung. Sie können diese jederzeit widerrufen.
            </p>
          </div>
        </div>

        {showDetails && (
          <div className="space-y-4 bg-slate-950/50 p-4 rounded-xl border border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-white">Technisch notwendig</p>
                <p className="text-xs text-gray-400">
                  Speichert Ihre Fallnummer und Spracheinstellungen.
                </p>
              </div>
              <Check className="w-5 h-5 text-gray-500" aria-label="Immer aktiv" />
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <div>
                <label htmlFor={analyticsId} className="font-bold text-sm text-white">
                  Analyse & Statistik
                </label>
                <p className="text-xs text-gray-400">
                  Anonyme Reichweitenmessung mit Umami (EU-Hosting, ohne Cookies).
                </p>
              </div>
              <input
                id={analyticsId}
                type="checkbox"
                checked={consents.analytics}
                onChange={(e) => setConsents({ ...consents, analytics: e.target.checked })}
                className="w-5 h-5 accent-[#20b2aa]"
              />
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <div>
                <label htmlFor={marketingId} className="font-bold text-sm text-white">
                  Externe Medien & Marketing
                </label>
                <p className="text-xs text-gray-400">
                  Wird für externe Inhalte und Zahlungsanbieter-Tracking benötigt.
                </p>
              </div>
              <input
                id={marketingId}
                type="checkbox"
                checked={consents.marketing}
                onChange={(e) => setConsents({ ...consents, marketing: e.target.checked })}
                className="w-5 h-5 accent-[#20b2aa]"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            aria-expanded={showDetails}
            className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            {showDetails ? (
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            )}
            {showDetails ? 'Weniger Details' : 'Einstellungen anpassen'}
          </button>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => speichern(showDetails ? consents : NUR_ESSENZIELL)}
              className="bg-transparent border-white/20 text-white hover:bg-white/5"
            >
              {showDetails ? 'Auswahl speichern' : 'Nur Essenzielle'}
            </Button>
            <Button
              onClick={() => speichern({ essential: true, analytics: true, marketing: true })}
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
