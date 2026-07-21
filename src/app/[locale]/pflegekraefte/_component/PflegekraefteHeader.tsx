// src/app/[locale]/pflegekraefte/_component/PflegekraefteHeader.tsx
'use client';

import { ArrowLeft, Stethoscope } from 'lucide-react';

import { Button } from '@/src/components/ui';

type Props = {
  locale: string;
  onBackAction: () => void;
};

export function PflegekraefteHeader({ onBackAction }: Props) {
  return (
    <header className="border-b border-white/10 bg-slate-950/40 px-4 py-6">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#20b2aa] to-[#3ddbd0] shadow-lg">
            <Stethoscope className="h-7 w-7 text-slate-950" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">B2B Fachkraft-Portal</h1>
            <p className="mt-0.5 text-xs text-gray-400">
              Kuratierte Ökosystem-Anwendungen für den ambulanten und stationären Dienst
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={onBackAction}
          className="self-start rounded-xl px-4 text-gray-400 hover:bg-white/5 hover:text-white sm:self-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zur Startseite
        </Button>
      </div>
    </header>
  );
}
