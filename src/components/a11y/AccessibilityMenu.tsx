// src/components/a11y/AccessibilityMenu.tsx
'use client';

import { Accessibility, Check } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { useAccessibility } from '@/src/hooks/useAccessibility';
import { Contrast, FontSize, Motion } from '@/src/lib/a11y';

const FONT_OPTIONS: { value: FontSize; label: string; sample: string }[] = [
  { value: 'normal', label: 'Standard', sample: 'A' },
  { value: 'large', label: 'Groß', sample: 'A' },
  { value: 'xlarge', label: 'Sehr groß', sample: 'A' },
];

const CONTRAST_OPTIONS: { value: Contrast; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Hoher Kontrast' },
];

const MOTION_OPTIONS: { value: Motion; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'reduced', label: 'Reduziert' },
];

/**
 * Barrierefreiheits-Einstellungen als zugängliches Panel (Tastatur + ARIA).
 * Frei platzierbar; hier als fixierter Button unten rechts eingebunden.
 */
export function AccessibilityMenu() {
  const { prefs, update } = useAccessibility();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // Escape schließt und gibt den Fokus zurück; Klick außerhalb schließt
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const group = 'flex gap-2';
  const chip = (active: boolean) =>
    `flex-1 min-h-[44px] px-3 rounded-lg border text-sm font-medium transition-colors inline-flex items-center justify-center gap-1.5 ${
      active
        ? 'border-accent bg-accent text-on-accent'
        : 'border-[var(--border-subtle)] text-on-surface hover:bg-[var(--surface-1)]'
    }`;

  return (
    <div
      ref={rootRef}
      className="fixed bottom-4 right-4 left-4 z-50 flex flex-col items-end pointer-events-none"
    >
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Barrierefreiheit-Einstellungen"
          // Breite/Höhe viewport-fest, damit das Panel auch bei großer Schrift
          // und auf schmalen Handys nicht aus dem Rahmen läuft.
          className="pointer-events-auto mb-3 w-72 max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-2xl border border-[var(--border-subtle)] bg-surface p-4 shadow-2xl"
        >
          <h2 className="text-base font-bold text-on-surface mb-3">Darstellung</h2>

          <fieldset className="mb-4">
            <legend className="text-xs font-semibold text-muted mb-1.5">Schriftgröße</legend>
            <div className={group}>
              {FONT_OPTIONS.map((o, i) => (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={prefs.fontSize === o.value}
                  onClick={() => update({ fontSize: o.value })}
                  className={chip(prefs.fontSize === o.value)}
                >
                  <span style={{ fontSize: `${0.9 + i * 0.2}rem` }}>{o.sample}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mb-4">
            <legend className="text-xs font-semibold text-muted mb-1.5">Kontrast</legend>
            <div className={group}>
              {CONTRAST_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={prefs.contrast === o.value}
                  onClick={() => update({ contrast: o.value })}
                  className={chip(prefs.contrast === o.value)}
                >
                  {prefs.contrast === o.value && <Check className="w-4 h-4" />}
                  {o.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-semibold text-muted mb-1.5">Bewegung</legend>
            <div className={group}>
              {MOTION_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={prefs.motion === o.value}
                  onClick={() => update({ motion: o.value })}
                  className={chip(prefs.motion === o.value)}
                >
                  {prefs.motion === o.value && <Check className="w-4 h-4" />}
                  {o.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label="Barrierefreiheit-Einstellungen öffnen"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-accent text-on-accent shadow-2xl transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <Accessibility className="h-7 w-7" />
      </button>
    </div>
  );
}
