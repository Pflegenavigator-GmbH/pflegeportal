// src/lib/a11y.ts
// Grundlage für Barrierefreiheits-Einstellungen. Der Nutzer wählt Werte,
// die als data-Attribute auf <html> landen und dort die zentralen Tokens
// steuern (siehe globals.css). Neue A11y-Features werden hier + im CSS
// ergänzt, nicht verstreut in den Komponenten.

export type FontSize = 'normal' | 'large' | 'xlarge';
export type Contrast = 'normal' | 'high';
export type Motion = 'system' | 'reduced';

export interface A11yPrefs {
  fontSize: FontSize;
  contrast: Contrast;
  motion: Motion;
}

export const DEFAULT_A11Y_PREFS: A11yPrefs = {
  fontSize: 'normal',
  contrast: 'normal',
  motion: 'system',
};

export const A11Y_STORAGE_KEY = 'pf-a11y';

export const FONT_SIZE_LABELS: Record<FontSize, string> = {
  normal: 'Standard',
  large: 'Groß',
  xlarge: 'Sehr groß',
};

/** Wendet die Präferenzen auf <html> an (data-Attribute). */
export function applyA11yPrefs(prefs: A11yPrefs): void {
  const el = document.documentElement;
  el.setAttribute('data-font-size', prefs.fontSize);
  // 'normal' = Nutzer hat bewusst Standard gewählt (System-HC ausschalten),
  // 'high' = an, kein Attribut-Wert 'auto' hier (den setzt nur das Init-Script
  // bei Systempräferenz ohne Nutzerwahl).
  el.setAttribute('data-contrast', prefs.contrast);
  el.setAttribute('data-motion', prefs.motion === 'reduced' ? 'reduced' : 'system');
}

/** Liest die Präferenzen aus dem localStorage (SSR-sicher). */
export function readA11yPrefs(): A11yPrefs {
  if (typeof window === 'undefined') return DEFAULT_A11Y_PREFS;
  try {
    const raw = window.localStorage.getItem(A11Y_STORAGE_KEY);
    if (!raw) return DEFAULT_A11Y_PREFS;
    return { ...DEFAULT_A11Y_PREFS, ...(JSON.parse(raw) as Partial<A11yPrefs>) };
  } catch {
    return DEFAULT_A11Y_PREFS;
  }
}

export function saveA11yPrefs(prefs: A11yPrefs): void {
  try {
    window.localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* Speicher nicht verfügbar — Einstellung gilt nur für die Session */
  }
}

/**
 * Inline-Script für den <head>: setzt die data-Attribute VOR dem ersten Paint,
 * damit es kein Aufblitzen (FOUC) gibt. Fällt bei fehlender Nutzerwahl auf die
 * Systempräferenz (prefers-contrast) zurück.
 */
export const A11Y_INIT_SCRIPT = `(function(){try{
var d=document.documentElement;
var raw=localStorage.getItem('${A11Y_STORAGE_KEY}');
var p=raw?JSON.parse(raw):{};
d.setAttribute('data-font-size', p.fontSize||'normal');
if(p.contrast==='high'){d.setAttribute('data-contrast','high');}
else if(p.contrast==='normal'){d.setAttribute('data-contrast','normal');}
else if(window.matchMedia&&window.matchMedia('(prefers-contrast: high)').matches){d.setAttribute('data-contrast','auto');}
d.setAttribute('data-motion', p.motion==='reduced'?'reduced':'system');
}catch(e){}})();`;
