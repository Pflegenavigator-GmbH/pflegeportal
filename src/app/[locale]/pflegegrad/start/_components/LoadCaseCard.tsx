// src/app/[locale]/pflegegrad/start/_components/LoadCaseCard.tsx
'use client';

import { KeyRound, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Label,
} from '@/src/components/ui';

interface LoadCaseCardProps {
  onLoad: (code: string) => Promise<void>;
  loading: boolean;
  externalError?: string;
}

export function LoadCaseCard({ onLoad, loading, externalError }: LoadCaseCardProps) {
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState('');
  const t = useTranslations('pflegegrad.start');

  const handleSubmit = () => {
    if (!code.trim()) {
      setLocalError('Bitte geben Sie einen gültigen Fallcode ein.');
      return;
    }
    setLocalError('');
    onLoad(code);
  };

  return (
    <Card className="bg-white/5 border-white/10 text-white shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
            <KeyRound className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-white">{t('loadTitle')}</CardTitle>
            <CardDescription className="text-gray-400 text-xs">
              {t('loadDescription')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="caseCode" className="text-gray-300 text-sm">
            {t('loadInputLabel')}
          </Label>
          <Input
            id="caseCode"
            type="text"
            placeholder={t('fallcodePlatzhalter')}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="text-center font-mono text-lg tracking-wider bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-[#20b2aa]"
            maxLength={12}
          />
        </div>
        {(localError || externalError) && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
            {localError || externalError}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSubmit}
          disabled={loading || !code.trim()}
          className="w-full border-white/10 text-white hover:bg-white/5 font-semibold"
          size="lg"
          variant="outline"
        >
          {loading ? t('loadButtonLoading') : t('loadButton')}
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
