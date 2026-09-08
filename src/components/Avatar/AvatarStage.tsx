'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';

import { ErrorBoundary } from '@/src/components/ui';

/**
 * three.js wird erst geladen, wenn diese Komponente den Avatar tatsächlich
 * rendert — nicht schon beim Seitenaufruf.
 *
 * Wichtig: Ein statischer `import` würde three.js (~260 KB gzip) in JEDE Seite
 * ziehen, selbst wenn die Komponente danach `null` zurückgibt. Ein `return null`
 * zur Laufzeit verhindert den Download nicht; nur `next/dynamic` tut das.
 * `ssr: false`, weil WebGL auf dem Server nicht existiert.
 */
const AvatarWidget = dynamic(() => import('./AvatarWidget'), { ssr: false });

/**
 * Seiten ohne Avatar. Sachliche Rechts-/Textseiten sollen weder abgelenkt
 * werden noch die 3D-Last tragen.
 */
const AUSGESCHLOSSENE_PFADE = ['/impressum', '/datenschutz', '/agb'];

/**
 * DIAGNOSE-SCHALTER — zum Abschalten auf `false` setzen.
 *
 * Zeigt einen gestrichelten Rahmen um die Avatar-Fläche und einen pinken
 * Referenzwürfel in der Szene. Damit lässt sich eingrenzen, woran es liegt,
 * wenn nichts zu sehen ist:
 *   • Rahmen + Würfel sichtbar, kein Roboter → Problem liegt am Modell
 *   • Rahmen sichtbar, kein Würfel          → 3D rendert nicht (WebGL/Canvas)
 *   • kein Rahmen                            → Komponente lädt nicht oder ist verdeckt
 */
const DEBUG = false;

/**
 * Liest, ob Bewegung reduziert werden soll — aus der Systemeinstellung UND
 * aus der Nutzerwahl im Barrierefreiheits-Menü (`data-motion` am <html>).
 *
 * `useSyncExternalStore` statt useState+useEffect: kein setState im Effekt,
 * kein Flackern beim ersten Rendern.
 */
function useReduzierteBewegung(): boolean {
  return useSyncExternalStore(
    (aenderung) => {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      mq.addEventListener('change', aenderung);

      // Die Nutzerwahl setzt data-motion am <html> — darauf mithören.
      const beobachter = new MutationObserver(aenderung);
      beobachter.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-motion'],
      });

      return () => {
        mq.removeEventListener('change', aenderung);
        beobachter.disconnect();
      };
    },
    () =>
      document.documentElement.dataset.motion === 'reduced' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    // Server-Snapshot: konservativ „nicht reduziert"; die Szene lädt ohnehin
    // erst clientseitig.
    () => false
  );
}

/**
 * Bühne für den 3D-Avatar: Positionierung, Laden und Fehlerabfang.
 *
 * Der Avatar ist derzeit rein dekorativ (Experiment) und deshalb für
 * Screenreader ausgeblendet. Sobald er interaktiv wird, braucht er einen
 * gleichwertigen Text-/Tastaturpfad — eine leere Landmark wäre schlechter
 * als gar keine.
 */
export default function AvatarStage() {
  const pathname = usePathname();
  const reduziert = useReduzierteBewegung();

  if (AUSGESCHLOSSENE_PFADE.some((pfad) => pathname.includes(pfad))) {
    return null;
  }

  return (
    // Wrapper ist klick-durchlässig; nur die Szene selbst fängt Zeiger ab,
    // damit der Avatar keine Bedienelemente darunter blockiert.
    // Links positioniert: rechts unten sitzt das Barrierefreiheits-Menü.
    <div
      // z-[110] liegt bewusst über dem Cookie-Banner (z-100): der Banner
      // erstreckt sich über den gesamten unteren Rand und verdeckte den
      // Avatar sonst teilweise.
      className={`pointer-events-none fixed bottom-6 left-6 z-[110] h-48 w-48 md:h-64 md:w-64 ${
        DEBUG ? 'rounded-lg border-2 border-dashed border-pink-500/70' : ''
      }`}
      aria-hidden="true"
    >
      {/* Schlägt WebGL oder das Laden des Modells fehl, bleibt die Stelle
          einfach leer — die App darf daran nicht scheitern. */}
      <ErrorBoundary fallback={null}>
        <div className="pointer-events-auto h-full w-full">
          <AvatarWidget reduzierteBewegung={reduziert} debug={DEBUG} />
        </div>
      </ErrorBoundary>
    </div>
  );
}
