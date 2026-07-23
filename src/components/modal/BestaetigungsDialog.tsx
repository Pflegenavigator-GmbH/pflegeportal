// src/components/modal/BestaetigungsDialog.tsx
'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from '@/src/components/ui';

interface Props {
  offen: boolean;
  onAbbrechen: () => void;
  onBestaetigen: () => void;
  titel: string;
  beschreibung: ReactNode;
  /** Was konkret passiert — als Aufzählung, damit die Folgen überschaubar bleiben. */
  folgen?: string[];
  bestaetigenText?: string;
  abbrechenText?: string;
  /** Läuft die Aktion gerade? Sperrt beide Knöpfe und zeigt einen Spinner. */
  laeuft?: boolean;
  laeuftText?: string;
  /** Rot einfärben, wenn die Aktion Daten unwiederbringlich entfernt. */
  destruktiv?: boolean;
}

/**
 * Bestätigung für folgenreiche Aktionen — ersetzt das native `confirm()`.
 *
 * Gegenüber `confirm()` gewinnt der Nutzer: eine benannte Aktion statt
 * „OK/Abbrechen", eine Auflistung der konkreten Folgen und eine sichtbare
 * Rückmeldung, solange die Aktion läuft. Ein natives `confirm()` friert
 * zudem den Browser-Tab ein und lässt sich weder gestalten noch übersetzen.
 *
 * Der Fokus springt beim Öffnen auf „Abbrechen": Bei einer destruktiven
 * Aktion soll ein versehentliches Enter nichts zerstören.
 */
export function BestaetigungsDialog({
  offen,
  onAbbrechen,
  onBestaetigen,
  titel,
  beschreibung,
  folgen,
  bestaetigenText = 'Bestätigen',
  abbrechenText = 'Abbrechen',
  laeuft = false,
  laeuftText,
  destruktiv = false,
}: Props) {
  const abbrechenRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (offen) abbrechenRef.current?.focus();
  }, [offen]);

  return (
    <Dialog
      open={offen}
      onOpenChange={(naechsterZustand) => {
        // Während die Aktion läuft, nicht über Escape/Backdrop schließen —
        // sonst steht der Nutzer vor unklarem Ausgang.
        if (!naechsterZustand && !laeuft) onAbbrechen();
      }}
    >
      <DialogContent showCloseButton={!laeuft} className="p-6">
        <div className="flex gap-4">
          {destruktiv && (
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{
                color: 'var(--status-rot)',
                backgroundColor: 'var(--status-rot-tint)',
                border: '1px solid var(--status-rot-border)',
              }}
            >
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
          )}

          <div className="min-w-0 space-y-3">
            <DialogTitle className="text-lg font-bold [overflow-wrap:anywhere]">
              {titel}
            </DialogTitle>

            <DialogDescription className="text-sm leading-relaxed [overflow-wrap:anywhere]">
              {beschreibung}
            </DialogDescription>

            {folgen && folgen.length > 0 && (
              <ul className="space-y-1.5 text-sm text-[var(--color-text-subtle)]">
                {folgen.map((folge) => (
                  <li
                    key={folge}
                    className="border-l-2 border-[var(--border-subtle)] pl-3 [overflow-wrap:anywhere]"
                  >
                    {folge}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Bei großer Schrift umbrechen statt überlaufen (WCAG 1.4.10) */}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            ref={abbrechenRef}
            variant="outline"
            onClick={onAbbrechen}
            disabled={laeuft}
            className="min-h-[44px] rounded-xl border-white/10 text-white hover:bg-white/5"
          >
            {abbrechenText}
          </Button>

          <Button
            onClick={onBestaetigen}
            disabled={laeuft}
            className="min-h-[44px] rounded-xl font-bold disabled:opacity-70"
            style={
              destruktiv
                ? { backgroundColor: 'var(--status-rot)', color: 'var(--bund-dunkelblau)' }
                : undefined
            }
          >
            {laeuft ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                {laeuftText ?? 'Wird ausgeführt…'}
              </>
            ) : (
              bestaetigenText
            )}
          </Button>
        </div>

        {/* Statusmeldung für Screenreader, damit der Ladezustand nicht nur
            visuell existiert. */}
        <span aria-live="polite" className="sr-only">
          {laeuft ? (laeuftText ?? 'Aktion wird ausgeführt') : ''}
        </span>
      </DialogContent>
    </Dialog>
  );
}
