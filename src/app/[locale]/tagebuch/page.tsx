// src/app/[locale]/tagebuch/page.tsx
'use client';

import { BookOpen, PlusCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';

import { Button } from '@/src/components/ui';
import { TagebuchData, TagebuchEintrag } from '@/src/types/tagebuch';

import { TagebuchForm } from './_component/TagebuchForm';
import { TagebuchListe } from './_component/TagebuchListe';

export default function TagebuchPage() {
  const t = useTranslations('tagebuch');
  /** Ob eine Sitzung besteht, beantwortet der Server (#135) — nicht der Browser. */
  const [sitzungOffen, setSitzungOffen] = useState<boolean | null>(null);

  const [entries, setEntries] = useState<TagebuchData>({});
  const [activeEntry, setActiveEntry] = useState<{ key: string; data: TagebuchEintrag } | null>(
    null
  );

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/tagebuch', { credentials: 'include' });
      setSitzungOffen(res.ok);
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden des Tagebuchs:', error);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;

    const loadData = async () => {
      try {
        const res = await fetch('/api/tagebuch', { credentials: 'include' });
        if (isSubscribed) setSitzungOffen(res.ok);
        if (res.ok) {
          const data = await res.json();
          if (isSubscribed) {
            setEntries(data);
          }
        }
      } catch (error) {
        console.error('Fetch-Fehler:', error);
      }
    };

    void loadData();

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Funktion zum Zurücksetzen des Formulars auf einen neuen Eintrag
  const handleNewEntryTrigger = () => {
    setActiveEntry(null);
  };

  // Erst nach der ersten Antwort entscheiden: Vorher wüsste die Seite nicht,
  // ob wirklich keine Sitzung besteht.
  if (sitzungOffen === false) {
    return <div className="text-center py-20 text-gray-400">{t('fallcodeFehlt')}</div>;
  }

  return (
    <main className="min-h-screen bg-slate-900 py-6 px-4 sm:py-12 text-white font-sans">
      <div className="container mx-auto max-w-5xl space-y-6 sm:space-y-8">
        {/* Modul-Kopfzeile */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-500/30 text-blue-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('titel')}</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">{t('untertitel')}</p>
          </div>
        </div>

        {/*
            Anpassung des Größenverhältnisses (3/4 zu 1/4):
            - Formular (md:col-span-9) nimmt nun den dominanten Raum ein.
            - Liste (md:col-span-3) rückt kompakt an die Seite.
          */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Haupt-Block: Strukturierte Erfassung (3/4 Breite auf Desktop) */}
          <div className="md:col-span-9 order-first md:order-last sticky md:top-6">
            <TagebuchForm
              onSavedAction={() => {
                fetchEntries();
                setActiveEntry(null);
              }}
              entryToEdit={activeEntry}
              onCancelAction={() => setActiveEntry(null)}
            />
          </div>

          {/* Seiten-Block: Chronologische Liste (1/4 Breite auf Desktop) */}
          <div className="md:col-span-3 space-y-4">
            {/* ➕ "Neuer Eintrag"-Button (Mindesthöhe 56px gemäß Block 18.9) */}
            <Button
              onClick={handleNewEntryTrigger}
              className="w-full h-[56px] bg-[#20b2aa] hover:bg-[#3ddbd0] text-slate-950 font-bold tracking-wide shadow-lg flex items-center justify-center gap-2 rounded-xl transition-all"
            >
              <PlusCircle className="w-5 h-5" />
              {t('neuerEintrag')}
            </Button>

            <TagebuchListe
              entries={entries}
              onRefresh={fetchEntries}
              onSelect={(key, data) => setActiveEntry({ key, data })}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
