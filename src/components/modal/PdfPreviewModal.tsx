// src/components/modal/PdfPreviewModal.tsx

'use client';

import { Printer, X, ShieldAlert, Building2 } from 'lucide-react';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from '@/src/components/ui';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPrint: () => void;
  briefText: string;
  versicherterName: string;
  caseCode: string | null;
  loading: boolean;
}

export function PdfPreviewModal({
  isOpen,
  onClose,
  onConfirmPrint,
  briefText,
  caseCode,
  loading,
}: PdfPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl my-auto animate-in fade-in zoom-in-95 duration-200">
        <Card className="bg-slate-900 border-white/10 text-white shadow-2xl overflow-hidden">
          {/* Header */}
          <CardHeader className="border-b border-white/5 bg-white/[0.01] flex flex-row items-center justify-between p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <Building2 className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-white">
                  Amtliche Druckvorschau (DIN 5008)
                </CardTitle>
                <CardDescription className="text-xs text-gray-400">
                  Verfahrenskorrespondenz Akte: {caseCode?.toUpperCase() || 'LOKAL'}
                </CardDescription>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </CardHeader>

          {/* DIN A4 Letter-Box */}
          <CardContent className="p-4 sm:p-6 bg-slate-950/40 max-h-[65vh] overflow-y-auto">
            <div
              id="widerspruch-preview-zone"
              className="bg-white text-slate-900 p-12 rounded-md shadow-2xl font-sans text-sm relative mx-auto border border-gray-300 select-none max-w-[210mm] min-h-[297mm]"
              style={{ boxShadow: '0 0 20px rgba(0,0,0,0.15)' }}
            >
              {/* 🏢 Professioneller Briefkopf / Corporate Header */}
              <div className="flex justify-between items-start border-b-2 border-[#20b2aa] pb-4 mb-8">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                    PflegeNavigator <span className="text-[#20b2aa]">EU</span>
                  </h2>
                  <p className="text-[10px] text-gray-500 font-medium tracking-wide uppercase mt-0.5">
                    Offizieller Dokumenten-Generator
                  </p>
                </div>
                <div className="text-right text-[10px] text-gray-400 font-mono">
                  <p>ID: {caseCode?.toUpperCase() || 'OFFLINE-VERSION'}</p>
                  <p>DATUM: {new Date().toLocaleDateString('de-DE')}</p>
                </div>
              </div>

              {/* Einzeilige Absenderzeile für das Kuvert-Sichtfenster */}
              <div className="text-[9px] text-gray-400 underline decoration-gray-300 mb-2 tracking-tight">
                PflegeNavigator EU gUG • Postfach 11 04 • 86601 Donauwörth
              </div>

              {/* Haupt-Textkörper */}
              <div className="font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-slate-800 tracking-tight">
                {briefText}
              </div>

              {/* 📜 Professionelle Fußzeile (DIN-Konform) */}
              <div className="absolute bottom-8 left-12 right-12 border-t border-gray-200 pt-3 flex justify-between items-center text-[9px] text-gray-400 font-sans">
                <div>
                  <p className="font-semibold text-slate-700">PflegeNavigator EU gUG</p>
                  <p>Gemeinnützige Unternehmergesellschaft</p>
                </div>
                <div className="text-center">
                  <p>Zertifiziert nach § 14 SGB XI</p>
                  <p>In-Memory RAM-Secured</p>
                </div>
                <div className="text-right">
                  <p>Seite 1 von 1</p>
                  <p>Stand: 2026</p>
                </div>
              </div>
            </div>
          </CardContent>

          {/* Footer */}
          <CardFooter className="border-t border-white/5 bg-white/[0.01] p-4 flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 text-[11px] text-gray-400 sm:flex-1 text-left">
              <ShieldAlert className="w-4 h-4 text-[#20b2aa] flex-shrink-0" />
              <span>Der Puppeteer-Core generiert das Dokument im verschlüsselten Server-RAM.</span>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 sm:flex-none border-white/10 text-white hover:bg-white/5 h-11 px-5"
              >
                Schließen
              </Button>
              <Button
                onClick={onConfirmPrint}
                disabled={loading}
                className="flex-1 sm:w-48 h-11 bg-[#20b2aa] hover:bg-[#3ddbd0] text-slate-950 font-bold text-sm shadow-md transition-all"
              >
                <Printer className="w-4 h-4 mr-2" />
                {loading ? 'Generiere PDF...' : 'Jetzt Dokument drucken'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
