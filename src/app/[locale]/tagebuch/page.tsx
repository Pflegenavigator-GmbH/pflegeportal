// src/app/[locale]/tagebuch/page.tsx
'use client';

import { BookOpen, PlusCircle } from 'lucide-react';
import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

import { Button } from '@/src/components/ui/button';
import { TagebuchData, TagebuchEintrag } from '@/src/types/tagebuch';

import { TagebuchForm } from './_component/TagebuchForm';
import { TagebuchListe } from './_component/TagebuchListe';

const subscribe = (listener: () => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', listener);
  return () => window.removeEventListener('storage', listener);
};

const getSnapshot = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('case_code');
};

const getServerSnapshot = () => null;

export default function TagebuchPage() {
  const caseCode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const [entries, setEntries] = useState<TagebuchData>({});
  const [activeEntry, setActiveEntry] = useState<{ key: string; data: TagebuchEintrag } | null>(
    null
  );

  const fetchEntries = useCallback(async () => {
    if (!caseCode) return;
    try {
      const res = await fetch(`/api/tagebuch?caseCode=${caseCode}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden des Tagebuchs:', error);
    }
  }, [caseCode]);

  useEffect(() => {
    let isSubscribed = true;

    const loadData = async () => {
      if (!caseCode) return;
      try {
        const res = await fetch(`/api/tagebuch?caseCode=${caseCode}`);
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
  }, [caseCode]);

  // Funktion zum Zurücksetzen des Formulars auf einen neuen Eintrag
  const handleNewEntryTrigger = () => {
    setActiveEntry(null);
  };

  if (caseCode === null) {
    return <div className="text-center py-20 text-gray-400">Bitte Fallcode laden.</div>;
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pflegetagebuch</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              Tägliche lückenlose Pflegenachweise als Hauptbeweis für den Begutachtungstermin.
            </p>
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
              caseCode={caseCode}
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
              Neuer Eintrag
            </Button>

            <TagebuchListe
              entries={entries}
              caseCode={caseCode}
              onRefresh={fetchEntries}
              onSelect={(key, data) => setActiveEntry({ key, data })}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
