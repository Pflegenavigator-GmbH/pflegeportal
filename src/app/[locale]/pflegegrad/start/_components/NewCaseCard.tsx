// src/app/[locale]/start/_components/NewCaseCard.tsx
'use client';

import { KeyRound, ArrowRight, AlertTriangle } from 'lucide-react';

import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/src/components/ui/card';

interface NewCaseCardProps {
  caseCode: string;
  onActivate: () => void;
}

export function NewCaseCard({ caseCode, onActivate }: NewCaseCardProps) {
  return (
    <Card className="bg-white/5 border-emerald-500/30 text-white shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
            <KeyRound className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <CardTitle className="text-white">Ihr persönlicher Fallcode</CardTitle>
            <CardDescription className="text-gray-400">
              Speichern Sie diesen Code gut ab
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-emerald-500/10 border-2 border-emerald-500/30 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-400 mb-2">Ihr Fallcode lautet:</p>
          <p className="text-3xl font-mono font-bold text-emerald-400 tracking-wider">{caseCode}</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-300">
            <strong>Wichtig:</strong> Notieren Sie sich diesen Code. Damit können Sie die Befragung
            jederzeit unterbrechen und an jedem Gerät kostenfrei fortsetzen.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={onActivate}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
          size="lg"
        >
          Weiter zu den Fragen (Kostenlos)
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
