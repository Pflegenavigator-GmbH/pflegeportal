// src/app/[locale]/pflegegrad/start/_components/NewCaseCard.tsx
'use client';

import { KeyRound, AlertTriangle, Users, Baby } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui';

interface NewCaseCardProps {
  caseCode: string;
  locale: string;
}

export function NewCaseCard({ caseCode, locale }: NewCaseCardProps) {
  const router = useRouter();
  const t = useTranslations('pflegegrad.start');

  return (
    <Card className="bg-white/5 border-emerald-500/30 text-white shadow-xl rounded-2xl overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
            <KeyRound className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <CardTitle className="text-white">{t('fallcodeTitel')}</CardTitle>
            <CardDescription className="text-gray-400 text-xs">
              {t('fallcodeUntertitel')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Generierter Code-Block */}
        <div className="bg-emerald-500/10 border-2 border-emerald-500/30 rounded-xl p-5 text-center">
          <p className="text-xs text-gray-400 mb-1">{t('fallcodeLautet')}</p>
          <p className="text-3xl font-mono font-bold text-emerald-400 tracking-wider">{caseCode}</p>
        </div>

        {/* Info-Hinweis */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300 leading-relaxed">
            <strong>{t('wichtig')}</strong> {t('fallcodeNotieren')}
          </p>
        </div>

        {/* 🧭 DIE INTEGRIERTE ALTERSWEICHE */}
        <div className="border-t border-white/10 pt-5 space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#20b2aa]">{t('zielgruppeTitel')}</h4>
            <p className="text-xs text-gray-400">{t('zielgruppeText')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Option A: Erwachsene */}
            <button
              onClick={() => {
                localStorage.setItem('pflege_zielgruppe', 'erwachsen');
                router.push(`/${locale}/pflegegrad/modul1`);
              }}
              className="p-4 bg-white/[0.02] border border-white/5 hover:border-[#20b2aa] rounded-xl text-left transition-all duration-200 hover:bg-white/5 group select-none flex flex-col justify-between"
            >
              <div>
                <Users className="w-5 h-5 text-[#20b2aa] mb-2 group-hover:scale-105 transition-transform" />
                <h5 className="font-bold text-xs text-white">{t('erwachseneTitel')}</h5>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                  {t('erwachseneText')}
                </p>
              </div>
            </button>

            {/* Option B: Kinder */}
            <button
              onClick={() => {
                localStorage.setItem('pflege_zielgruppe', 'kind');
                router.push(`/${locale}/pflegegrad/kinder`);
              }}
              className="p-4 bg-white/[0.02] border border-white/5 hover:border-pink-500 rounded-xl text-left transition-all duration-200 hover:bg-white/5 group select-none flex flex-col justify-between"
            >
              <div>
                <Baby className="w-5 h-5 text-pink-400 mb-2 group-hover:scale-105 transition-transform" />
                <h5 className="font-bold text-xs text-white">{t('kinderTitel')}</h5>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{t('kinderText')}</p>
              </div>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
