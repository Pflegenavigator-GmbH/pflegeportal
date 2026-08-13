// src/components/rechtliches/Sprachhinweis.tsx
import { Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

/**
 * Weist darauf hin, dass ein Rechtstext nur auf Deutsch vorliegt.
 *
 * Hintergrund der Entscheidung (Issue #84): AGB, Datenschutzerklärung und
 * Impressum bleiben deutsch. Eine übersetzte Fassung, die inhaltlich
 * abweicht, wirft die Frage auf, welche bindet — bei einem Portal, das
 * Gesundheitsdaten nach Art. 9 DSGVO verarbeitet, ist das keine Formalie.
 * Das Impressum muss nach § 5 DDG ohnehin deutsch vorliegen.
 *
 * Die Bedienung der Betroffenenrechte (Auskunft, Löschung) ist dagegen sehr
 * wohl übersetzt: Art. 12 DSGVO verlangt dafür eine „leicht zugängliche
 * Form", und ein Sprachwechsel mitten im Löschvorgang wäre genau die Hürde,
 * die die Norm ausschließen soll.
 *
 * Der Hinweis erscheint nur außerhalb von Deutsch — auf der deutschen Fassung
 * wäre er sinnlos und würde nur Fläche kosten.
 */
export function Sprachhinweis() {
  const locale = useLocale();
  const t = useTranslations('rechtliches.sprachhinweis');

  if (locale === 'de') return null;

  return (
    <div
      className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4"
      role="note"
    >
      <Languages className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" aria-hidden="true" />
      <div className="text-xs leading-relaxed text-gray-300">
        <strong className="mb-0.5 block font-bold text-amber-400">{t('titel')}</strong>
        {t('text')}
      </div>
    </div>
  );
}
