// src/app/[locale]/pflegekraefte/_component/TransparencyNotice.tsx
import { Info } from 'lucide-react';

export function TransparencyNotice() {
    return (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
            <div className="text-xs leading-relaxed text-gray-300">
                <strong>Transparenz-Hinweis:</strong> Die aufgeführten Software-Lösungen sind geschützte Produkte externer Marktteilnehmer.
                PflegeNavigator EU agiert vollkommen plattformneutral, betreibt kein Affiliate-Marketing und übernimmt keine Haftung für
                Software-Zulassungen innerhalb Ihrer Einrichtung.
            </div>
        </div>
    );
}