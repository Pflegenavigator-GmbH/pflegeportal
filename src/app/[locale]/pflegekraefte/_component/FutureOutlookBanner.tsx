// src/app/[locale]/pflegekraefte/_component/FutureOutlookBanner.tsx
import { Smartphone } from 'lucide-react';

export function FutureOutlookBanner() {
  return (
    <div className="rounded-xl border border-[#20b2aa]/20 bg-gradient-to-r from-[#20b2aa]/10 to-[#3ddbd0]/5 p-6 shadow-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex-shrink-0 rounded-xl bg-[#20b2aa]/10 p-3 text-[#20b2aa]">
          <Smartphone className="h-8 w-8" />
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="text-base font-bold text-white">
            Zukunftsausblick: Native Schnittstellenintegration (2026)
          </h3>
          <p className="text-xs leading-relaxed text-gray-400">
            Wir arbeiten an einer direkten API-Kopplung für ambulante Pflegedienste. Verläufe
            unseres Rechners und das DiPA-Pflagetagebuch können in Zukunft verschlüsselt in
            Drittsysteme via FHIR-Schnittstelle exportiert werden.
          </p>
        </div>
      </div>
    </div>
  );
}
