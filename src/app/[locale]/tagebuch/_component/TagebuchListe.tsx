// src/app/[locale]/tagebuch/_component/TagebuchListe.tsx
'use client';
import { useState } from 'react';
import { TagebuchData, TagebuchEintrag } from '@/src/types/tagebuch';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// Typendefinition für die monatsweise Gruppierung
interface GroupedEntries {
    [month: string]: { key: string; entry: TagebuchEintrag }[];
}

export function TagebuchListe({ entries, caseCode, onRefresh, onSelect }: {
    entries: TagebuchData,
    caseCode: string,
    onRefresh: () => void,
    onSelect: (key: string, data: TagebuchEintrag) => void
}) {
    const [openMonths, setOpenMonths] = useState<string[]>([]);

    // Typisierung (GroupedEntries) an den reduce-Accumulator übergeben
    const grouped = Object.entries(entries).reduce((acc: GroupedEntries, [key, entry]) => {
        const month = new Date(entry.date).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
        if (!acc[month]) acc[month] = [];
        acc[month].push({ key, entry });
        return acc;
    }, {} as GroupedEntries);

    const handleDelete = async (e: React.MouseEvent, key: string) => {
        e.stopPropagation();
        if (!confirm("Wirklich löschen?")) return;
        const res = await fetch(`/api/tagebuch?caseCode=${caseCode}&entryKey=${key}`, { method: 'DELETE' });
        if (res.ok) { onRefresh(); toast.success("Gelöscht"); }
    };

    return (
        <div className="space-y-4">
            {Object.entries(grouped).map(([month, items]) => (
                <div key={month} className="border border-white/10 rounded-xl overflow-hidden">
                    <button onClick={() => setOpenMonths(p => p.includes(month) ? p.filter(m => m !== month) : [...p, month])}
                            className="w-full p-4 bg-white/5 flex justify-between">
                        <span className="font-bold text-[#20b2aa]">{month}</span>
                        {openMonths.includes(month) ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                    </button>
                    {openMonths.includes(month) && (
                        <div className="bg-slate-950/50 p-2 space-y-2">
                            {/* Wir brauchen hier keine Typisierung mehr im .map, da 'items' aus GroupedEntries abgeleitet wird */}
                            {items.map(({ key, entry }) => (
                                <div key={key} onClick={() => onSelect(key, entry)}
                                     className="group p-3 hover:bg-white/10 rounded-lg cursor-pointer transition-all border border-transparent hover:border-white/10">
                                    <div className="flex justify-between items-start">
                                        <p className="text-[10px] text-gray-400 font-mono">{new Date(entry.date).toLocaleDateString('de-DE')}</p>
                                        <button onClick={(e) => handleDelete(e, key)} className="opacity-0 group-hover:opacity-100 text-rose-400"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                    <p className="text-sm text-gray-200 mt-1 truncate">{entry.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}