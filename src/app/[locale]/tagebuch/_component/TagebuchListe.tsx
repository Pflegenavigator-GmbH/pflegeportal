// src/app/[locale]/tagebuch/_component/TagebuchListe.tsx
'use client';

import { ChevronDown, ChevronRight, Trash2, FileDown, AlertTriangle, Calendar } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { validateAndStoreSession } from '@/src/app/actions/case-session';
import { PaywallModal } from '@/src/components/modal/PaywallModal';
import { Button } from '@/src/components/ui/button';
import { TagebuchPreviewModal } from '@/src/components/modal/TagebuchPreviewModal';
import { TagebuchData, TagebuchEintrag } from '@/src/types/tagebuch';

interface GroupedEntries {
  [month: string]: { key: string; entry: TagebuchEintrag }[];
}

const MVP_PRODUCTS = [
  { id: 'beta_special', name: 'Beta-Special (12 Monate)', price_cents: 2900 },
];

export function TagebuchListe({
                                entries,
                                caseCode,
                                onRefresh,
                                onSelect,
                              }: {
  entries: TagebuchData;
  caseCode: string;
  onRefresh: () => void;
  onSelect: (key: string, data: TagebuchEintrag) => void;
}) {
  const [openMonths, setOpenMonths] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Modals Steuerung
  const [showPreview, setShowPreview] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const grouped = Object.entries(entries).reduce((acc: GroupedEntries, [key, entry]) => {
    if (!entry || !entry.date) return acc;
    const month = new Date(entry.date).toLocaleDateString('de-DE', {
      month: 'long',
      year: 'numeric',
    });
    if (!acc[month]) acc[month] = [];
    acc[month].push({ key, entry });
    return acc;
  }, {} as GroupedEntries);

  const handleDelete = async (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    if (!confirm('Möchten Sie diesen Tagebucheintrag unwiderruflich löschen?')) return;

    const res = await fetch(`/api/tagebuch?caseCode=${caseCode}&entryKey=${key}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      onRefresh();
      toast.success('Eintrag erfolgreich entfernt.');
    } else {
      toast.error('Fehler beim Löschen des Eintrags.');
    }
  };

  // 🛡️ Paywall- & Lizenzprüfung vor dem PDF-Transit
  const handlePdfExportInit = async () => {
    const toastId = toast.loading('Verifiziere Dokumentenlizenz...');
    try {
      const status = await validateAndStoreSession(caseCode);
      toast.dismiss(toastId);

      if (!status.success || !status.isUnlocked) {
        setShowPaywall(true);
      } else {
        setShowPreview(true);
      }
    } catch {
      toast.dismiss(toastId);
      toast.error('Verbindungsfehler bei der Lizenzprüfung.');
    }
  };

  const executePdfDownload = async () => {
    setIsExporting(true);
    const toastId = toast.loading('PDF wird serverseitig kompiliert...');

    try {
      const response = await fetch(`/api/pdf/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseCode: caseCode.toUpperCase(),
          documentType: 'tagebuch',
          title: `Pflegetagebuch_Akte_${caseCode.toUpperCase()}`,
        }),
      });

      if (!response.ok) throw new Error();
      toast.success('Dossier erfolgreich heruntergeladen!', { id: toastId });
      setShowPreview(false);
    } catch {
      toast.error('Fehler bei der PDF-Generierung.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCheckoutSubmit = async (paketId: string) => {
    try {
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseCode: caseCode.toUpperCase(), paket: paketId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      toast.error('Stripe-Verbindungsfehler.');
    }
  };

  return (
      <div className="space-y-3">
        <div className="flex flex-col gap-2 bg-white/5 border border-white/10 p-3 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300">
            <Calendar className="w-3.5 h-3.5 text-[#20b2aa]" />
            <span>Historie ({Object.keys(entries).length})</span>
          </div>
          <Button
              onClick={handlePdfExportInit}
              disabled={Object.keys(entries).length === 0}
              className="w-full bg-[#1a4480] hover:bg-[#0f2744] text-white border border-white/10 h-10 text-xs font-bold shadow-md"
          >
            <FileDown className="w-3.5 h-3.5 mr-1.5" /> PDF exportieren
          </Button>
        </div>

        {Object.keys(grouped).length === 0 && (
            <div className="text-center py-8 border border-dashed border-white/10 rounded-xl text-gray-500 text-xs px-2">
              Noch keine Einträge vorhanden.
            </div>
        )}

        {Object.entries(grouped).map(([month, items]) => (
            <div key={month} className="border border-white/10 rounded-xl overflow-hidden bg-slate-950/20 text-xs">
              <button
                  onClick={() => setOpenMonths((p) => p.includes(month) ? p.filter((m) => m !== month) : [...p, month])}
                  className="w-full p-3 bg-white/5 flex justify-between items-center border-b border-white/5"
              >
                <span className="font-bold text-[#20b2aa] truncate max-w-[120px]">{month}</span>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 flex-shrink-0">
                  <span>{items.length}x</span>
                  {openMonths.includes(month) ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
                </div>
              </button>

              {openMonths.includes(month) && (
                  <div className="p-2 space-y-1.5 bg-slate-950/40">
                    {items.map(({ key, entry }) => {
                      const hasAlert = entry.sturz || entry.krankenhaus || entry.bettlaegerig;

                      return (
                          <div
                              key={key}
                              onClick={() => onSelect(key, entry)}
                              className={`group p-3 rounded-lg border cursor-pointer transition-all ${
                                  hasAlert ? 'bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10' : 'bg-white/[0.01] border-white/5 hover:bg-white/5'
                              }`}
                          >
                            <div className="flex justify-between items-center gap-1">
                              <span className="text-[10px] font-mono font-bold text-[#20b2aa] bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                {new Date(entry.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                              </span>
                              <button onClick={(e) => handleDelete(e, key)} className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 transition-opacity p-0.5">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-300 mt-2 font-sans line-clamp-1 break-all">{entry.content}</p>
                            <div className="mt-2 flex flex-wrap gap-1 items-center">
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">S: {entry.schmerzen}/10</span>
                              {entry.sturz && <span className="text-[10px] inline-flex items-center px-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium"><AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> Sturz</span>}
                              {entry.krankenhaus && <span className="text-[10px] px-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">Klinik</span>}
                              {entry.medikamentenKontrolle && <span className="text-[10px] px-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Med ✓</span>}
                            </div>
                          </div>
                      );
                    })}
                  </div>
              )}
            </div>
        ))}

        {/* 📋 MODALS PIPELINE */}
        {showPreview && (
            <TagebuchPreviewModal
                entries={entries}
                caseCode={caseCode}
                isDownloading={isExporting}
                onDownload={executePdfDownload}
                onClose={() => setShowPreview(false)}
            />
        )}

        {showPaywall && (
            <PaywallModal
                caseCode={caseCode}
                isExpired={false}
                products={MVP_PRODUCTS}
                onCheckout={handleCheckoutSubmit}
                onClose={() => setShowPaywall(false)}
                loading={false}
            />
        )}
      </div>
  );
}
