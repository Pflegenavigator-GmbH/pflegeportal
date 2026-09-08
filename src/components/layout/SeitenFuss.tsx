// src/components/layout/SeitenFuss.tsx
import { Shield } from 'lucide-react';

import { cn } from '@/src/lib/utils';

/**
 * Abschluss einer Seite — die Trennlinie unter dem Inhalt.
 *
 * Vorher baute jede Seite ihren eigenen Fuß: drei verschiedene Abstände nach
 * oben (3rem, 2rem, keiner), drei verschiedene Rahmenfarben, und auf der
 * FAQ-Seite gar keine Farbe, sodass dort `currentColor` durchschlug. Die
 * Fußzeilen saßen dadurch von Seite zu Seite auf unterschiedlicher Höhe.
 *
 * Die Rahmenfarbe kommt aus `--border-subtle` statt aus `border-white/10`.
 * Beide sind im Normalfall identisch, aber der Token wird im
 * Hochkontrast-Modus auf rgba(255,255,255,0.45) angehoben — die feste
 * Tailwind-Klasse bliebe blass und die Trennlinie unsichtbar.
 *
 * Bewusst NICHT umgestellt: die Presse-Seiten. Sie sind ein eigenständiges
 * helles Design mit lokaler, gegen Weiß kontrastgeprüfter Palette; der dunkle
 * Token würde dort die Linie verschwinden lassen.
 */
export function SeitenFuss({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <footer
      className={cn('mt-12 border-t border-[var(--border-subtle)] pt-6 text-center', className)}
    >
      {children}
    </footer>
  );
}

/**
 * Rechtlicher Hinweis am Seitenende — Schild-Symbol und Kleingedrucktes.
 *
 * Fasst die drei Rechner-Hinweise (EM-Rente, Modul 6, GdB) in eine Form:
 * gleiche Höhe, gleiche Textfarbe, gleiche Zeilenbreite. Die Farbe kommt aus
 * `--color-text-faint`, das im Hochkontrast-Modus mitzieht — `text-gray-500`
 * tut das nicht.
 */
export function RechtshinweisFuss({ children }: { children: React.ReactNode }) {
  return (
    <SeitenFuss>
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-2 text-xs leading-relaxed text-[var(--color-text-faint)] sm:flex-row">
        <Shield className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
        <p>{children}</p>
      </div>
    </SeitenFuss>
  );
}
