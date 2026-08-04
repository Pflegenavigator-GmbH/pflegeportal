// src/components/i18n/LanguageSwitcher.tsx
'use client';

import { Check, Globe, Search } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useMemo, useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
} from '@/src/components/ui';
import { aktiveSprachen } from '@/src/i18n/config';
import { useLanguageChange } from '@/src/i18n/useLanguageChange';

export default function LanguageSwitcher() {
  const [search, setSearch] = useState('');
  const locale = useLocale();
  const { changeLanguage } = useLanguageChange();

  const currentLanguage = aktiveSprachen.find((lang) => lang.code === locale) ?? aktiveSprachen[0];

  const filteredLanguages = useMemo(() => {
    const query = search.trim().toLowerCase();

    return aktiveSprachen.filter(
      (lang) =>
        lang.nativeName.toLowerCase().includes(query) ||
        lang.name.toLowerCase().includes(query) ||
        lang.code.toLowerCase().includes(query)
    );
  }, [search]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="hidden items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-1.5 shadow-inner transition-colors hover:bg-slate-900 sm:flex"
          aria-label="Sprache wechseln"
        >
          <Globe className="h-3.5 w-3.5 text-[#20b2aa]" />
          <span className="font-mono text-xs font-medium uppercase text-gray-300">
            {currentLanguage.code}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="max-h-[70vh] w-80 overflow-hidden border-white/10 bg-[#0f2744] p-0 text-white">
        <div className="border-b border-white/10 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sprache suchen..."
              className="h-10 border-white/10 bg-slate-950/50 pl-10 text-white placeholder:text-gray-500 focus-visible:ring-[#20b2aa]"
            />
          </div>

          <p className="mt-2 text-xs text-gray-400">
            {filteredLanguages.length} von {aktiveSprachen.length} Sprachen
          </p>
        </div>

        <div className="max-h-[calc(70vh-92px)] overflow-y-auto p-1">
          {filteredLanguages.map((lang) => {
            const selected = lang.code === locale;

            return (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${
                  selected ? 'bg-white/10' : ''
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base leading-none" role="img" aria-label={lang.nativeName}>
                    {lang.flag}
                  </span>
                  <span className="text-sm">{lang.nativeName}</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Kein „Beta"-Abzeichen mehr: Im Umschalter stehen nur noch
                      Sprachen mit echten Übersetzungen (aktiveSprachen). Das
                      frühere Abzeichen hing an `complete`, das handgepflegt und
                      falsch war — siehe languages.ts. */}

                  {selected && <Check className="h-4 w-4 text-[#20b2aa]" />}
                </div>
              </DropdownMenuItem>
            );
          })}

          {filteredLanguages.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-gray-500">
              Keine Sprache gefunden
            </div>
          )}
        </div>

        <DropdownMenuSeparator className="my-0 bg-white/10" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
