// src/app/[locale]/tagebuch/page.tsx
'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

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
  // 🔥 Linter-freundlich: Wir lesen den localStorage flackerfrei aus
  const caseCode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const [entries, setEntries] = useState<TagebuchData>({});
  const [activeEntry, setActiveEntry] = useState<{ key: string; data: TagebuchEintrag } | null>(
    null
  );

  // Wird von Child-Komponenten genutzt, um nach dem Speichern neu zu laden
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

  // 🔥 Linter-freundlich: Asynchroner Fetch mit Clean-Up
  useEffect(() => {
    let isSubscribed = true;

    const loadData = async () => {
      if (!caseCode) return;
      try {
        const res = await fetch(`/api/tagebuch?caseCode=${caseCode}`);
        if (res.ok) {
          const data = await res.json();
          // Der State wird garantiert asynchron gesetzt. Der Linter ist glücklich!
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
      // Verhindert Memory Leaks, falls die Komponente unmounted wird
      isSubscribed = false;
    };
  }, [caseCode]);

  // SSR Fallback (verhindert Hydration Error, wenn Fallcode noch nicht da ist)
  if (caseCode === null) {
    return <div className="text-center py-20 text-gray-400">Bitte Fallcode laden.</div>;
  }

  return (
    <main className="min-h-screen bg-slate-900 py-12 px-4 text-white">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold mb-8">Pflegetagebuch</h1>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <TagebuchListe
              entries={entries}
              caseCode={caseCode}
              onRefresh={fetchEntries}
              onSelect={(key, data) => setActiveEntry({ key, data })}
            />
          </div>
          <div className="md:col-span-1">
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
        </div>
      </div>
    </main>
  );
}
