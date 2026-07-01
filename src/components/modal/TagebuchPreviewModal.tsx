// src/components/modal/TagebuchPreviewModal.tsx
'use client';

import { X, FileDown, ShieldAlert } from 'lucide-react';

import {generateTagebuchHtml} from "@/src/app/[locale]/tagebuch/constants/tagebuchTemplate";
import { Button } from '@/src/components/ui/button';
import { TagebuchData } from '@/src/types/tagebuch';



interface TagebuchPreviewModalProps {
    entries: TagebuchData;
    caseCode: string;
    onClose: () => void;
    onDownload: () => void;
    isDownloading: boolean;
}

export function TagebuchPreviewModal({
                                         entries,
                                         caseCode,
                                         onClose,
                                         onDownload,
                                         isDownloading,
                                     }: TagebuchPreviewModalProps) {
    const htmlContent = generateTagebuchHtml(entries, caseCode);

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">

                {/* Modal Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-950/40">
                    <div>
                        <h3 className="text-sm font-bold text-white">Vorschau: Offizielles Pflegetagebuch</h3>
                        <p className="text-xs text-gray-400">Akte: {caseCode.toUpperCase()}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Iframe Dokument-Container */}
                <div className="flex-1 bg-white p-2">
                    <iframe
                        srcDoc={htmlContent}
                        title="Pflegetagebuch Gutachten-Vorschau"
                        className="w-full h-full border-0 bg-white"
                        sandbox="allow-same-origin"
                    />
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-white/10 bg-slate-950/60 flex flex-col sm:flex-row items-center gap-3 justify-between">
                    <div className="flex items-center gap-2 text-amber-400 text-xs max-w-sm text-center sm:text-left">
                        <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                        <span>Generiert nach den gesetzlichen MD-Formblättern (SGB XI Standard 2026).</span>
                    </div>
                    <Button
                        onClick={onDownload}
                        disabled={isDownloading}
                        className="w-full sm:w-auto h-12 bg-[#20b2aa] hover:bg-[#3ddbd0] text-slate-950 font-bold text-sm px-6 shadow-xl"
                    >
                        <FileDown className="w-4 h-4 mr-2" />
                        {isDownloading ? 'Generiere PDF...' : 'Jetzt als PDF exportieren'}
                    </Button>
                </div>

            </div>
        </div>
    );
}
