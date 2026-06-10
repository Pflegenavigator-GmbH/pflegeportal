import { AlertTriangle } from 'lucide-react';

export function GdbWarning() {
  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />

      <div className="text-gray-300 text-xs leading-relaxed space-y-1">
        <p>
          <strong>Wichtige Kriterien zur Antragstellung beim Versorgungsamt:</strong>
        </p>

        <ul className="list-disc list-inside space-y-0.5 text-gray-400">
          <li>Die gesundheitlichen Einschränkungen müssen seit mindestens 6 Monaten andauern.</li>
          <li>Ein offizieller Befundbericht behandelnder Fachärzte muss zwingend vorliegen.</li>
        </ul>
      </div>
    </div>
  );
}
