// src/components/modal/BriefFormModal.tsx
'use client';

import {ReactNode, useState} from 'react';

import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { useBriefGeneration } from '@/src/hooks/useBriefGeneration';
import { BriefType, BriefPayload } from '@/src/types/briefe';
import { FileText, Download, Eye, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogDescription,
} from '@/src/components/ui/dialog'


interface BriefFormModalProps {
    typ: BriefType;
    isOpen: boolean;
    onClose: () => void;
}

function DialogTitle(props: { className: string, children: ReactNode }) {
    return null;
}

export function BriefFormModal({ typ, isOpen, onClose }: BriefFormModalProps) {
    const { loading, previewText, generatePreview, downloadPdf } = useBriefGeneration();

    // Formular-Stammdaten-State
    const [absender, setAbsender] = useState({ name: '', strasse: '', plz: '', ort: '', telefon: '', email: '' });
    const [empfaenger, setEmpfaenger] = useState({ name: 'Zuständige Behörde / Kasse', strasse: '', plz: '', ort: '' });
    const [hauptteil, setHauptteil] = useState('');
    const [betreff, setBetreff] = useState(`Anliegen bezüglich ${typ}`);

    const assemblePayload = (): BriefPayload => ({
        type: typ,
        absender,
        empfaenger,
        betreff,
        inhalt: {
            betreff,
            anrede: 'Sehr geehrte Damen und Herren,',
            hauptteil
        }
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-slate-950 border border-white/10 text-white max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl font-sans p-6 sm:p-8">
                <DialogHeader className="pb-4 border-b border-white/5">
                    <DialogTitle className="text-xl font-bold text-[#20b2aa] flex items-center gap-2">
                        <FileText className="w-5 h-5" /> DIN 5008 Vorlage: {typ.toUpperCase()}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-400">
                        Tragen Sie Ihre Daten ein. Die Formatierung und Fristen-Zuweisung erfolgt vollautomatisch im Backend.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
                    {/* Linke Seite: Datenerfassung */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide">1. Absender (Versicherter)</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-400">Vollständiger Name</Label>
                                <Input value={absender.name} onChange={e => setAbsender({...absender, name: e.target.value})} className="bg-slate-900 border-white/10 h-10 text-sm" placeholder="Max Mustermann" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-400">Straße & Hausnummer</Label>
                                <Input value={absender.strasse} onChange={e => setAbsender({...absender, strasse: e.target.value})} className="bg-slate-900 border-white/10 h-10 text-sm" placeholder="Musterstr. 1" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-400">PLZ</Label>
                                <Input value={absender.plz} onChange={e => setAbsender({...absender, plz: e.target.value})} className="bg-slate-900 border-white/10 h-10 text-sm" placeholder="12345" maxLength={5} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-400">Ort</Label>
                                <Input value={absender.ort} onChange={e => setAbsender({...absender, ort: e.target.value})} className="bg-slate-900 border-white/10 h-10 text-sm" placeholder="Musterstadt" />
                            </div>
                        </div>

                        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide pt-2">2. Empfänger (Behörde/Kasse)</h3>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-400">Name der Institution</Label>
                                <Input value={empfaenger.name} onChange={e => setEmpfaenger({...empfaenger, name: e.target.value})} className="bg-slate-900 border-white/10 h-10 text-sm" />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-xs text-gray-400">Straße</Label>
                                    <Input value={empfaenger.strasse} onChange={e => setEmpfaenger({...empfaenger, strasse: e.target.value})} className="bg-slate-900 border-white/10 h-10 text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-400">PLZ</Label>
                                    <Input value={empfaenger.plz} onChange={e => setEmpfaenger({...empfaenger, plz: e.target.value})} className="bg-slate-900 border-white/10 h-10 text-sm" />
                                </div>
                            </div>
                        </div>

                        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide pt-2">3. Inhaltliche Spezifikation</h3>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-400">Betreffzeile</Label>
                                <Input value={betreff} onChange={e => setBetreff(e.target.value)} className="bg-slate-900 border-white/10 h-10 text-sm" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-400">Begründung / Spezifischer Sachverhalt</Label>
                                <Textarea value={hauptteil} onChange={e => setHauptteil(e.target.value)} rows={4} className="bg-slate-900 border-white/10 text-sm resize-none" placeholder="Beschreiben Sie hier kurz die Einschränkungen oder den Grund des Schreibens..." />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button onClick={() => generatePreview(assemblePayload())} disabled={loading || !absender.name} variant="outline" className="flex-1 h-11 border-white/10 hover:bg-white/5">
                                <Eye className="w-4 h-4 mr-2" /> Vorschau Text
                            </Button>
                            <Button onClick={() => downloadPdf(assemblePayload())} disabled={loading || !absender.name} className="flex-1 h-11 bg-[#20b2aa] hover:bg-[#3ddbd0] text-slate-950 font-bold">
                                <Download className="w-4 h-4 mr-2" /> PDF generieren
                            </Button>
                        </div>
                    </div>

                    {/* Rechte Seite: Live-Text-Preview */}
                    <div className="flex flex-col h-full justify-between bg-slate-900/50 border border-white/5 rounded-2xl p-4 min-h-[300px]">
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Virtuelles Dokumenten-Auge</h3>
                            {previewText ? (
                                <div className="font-mono text-[11px] text-gray-300 whitespace-pre-wrap max-h-[400px] overflow-y-auto leading-relaxed bg-slate-950 p-4 rounded-xl border border-white/5">
                                    {previewText}
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 text-xs py-20">
                                    Klicken Sie auf Vorschau Text, um den generierten DIN-Entwurf vorab zu prüfen.
                                </div>
                            )}
                        </div>
                        <div className="text-[10px] text-gray-500 border-t border-white/5 pt-3 mt-4">
                            * Generierter Text entspricht dem offiziellen Schriftsatz-Standard.
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}