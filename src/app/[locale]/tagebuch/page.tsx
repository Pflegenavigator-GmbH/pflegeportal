// src/app/[locale]/tagebuch/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { TagebuchData, TagebuchEintrag } from '@/src/types/tagebuch';
import { TagebuchForm } from './_component/TagebuchForm';
import { TagebuchListe } from './_component/TagebuchListe';

export default function TagebuchPage() {
    const [caseCode, setCaseCode] = useState<string | null>(null);
    const [entries, setEntries] = useState<TagebuchData>({});
    const [activeEntry, setActiveEntry] = useState<{key: string, data: TagebuchEintrag} | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchEntries = async () => {
        if (!caseCode) return;
        const res = await fetch(`/api/tagebuch?caseCode=${caseCode}`);
        const data = await res.json();
        setEntries(data);
    };

    useEffect(() => {
        setCaseCode(localStorage.getItem('case_code'));
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (caseCode) fetchEntries();
    }, [caseCode]);

    if (isLoading) return null;
    if (!caseCode) return <div className="text-center py-20 text-gray-400">Bitte Fallcode laden.</div>;

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
                            onSelect={(key, data) => setActiveEntry({key, data})}
                        />
                    </div>
                    <div className="md:col-span-1">
                        <TagebuchForm
                            caseCode={caseCode}
                            onSaved={() => { fetchEntries(); setActiveEntry(null); }}
                            entryToEdit={activeEntry}
                            onCancel={() => setActiveEntry(null)}
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}