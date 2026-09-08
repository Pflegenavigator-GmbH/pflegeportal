// src/app/[locale]/gdb/_component/gdb-footer.tsx
import { RechtshinweisFuss } from '@/src/components/layout/SeitenFuss';

/**
 * Rechtlicher Hinweis unter dem GdB-Rechner.
 *
 * Nutzt dieselbe Form wie die Hinweise unter dem EM-Renten-Rechner und
 * Modul 6. Vorher fehlte hier der Abstand nach oben komplett, wodurch die
 * Trennlinie direkt am Inhalt klebte.
 *
 * Der Text ist noch fest deutsch — der GdB-Bereich hängt an Issue #26 und ist
 * bislang nicht übersetzbar gemacht.
 */
export function GdbFooter() {
  return (
    <RechtshinweisFuss>
      <strong>Gesetzlicher Hinweis:</strong> Dieser GdB-Rechner simuliert das behördliche
      Feststellungsverfahren nach den versorgungsmedizinischen Grundsätzen.
    </RechtshinweisFuss>
  );
}
