'use client';

import { FileText, Download, Eye } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ReactNode, useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  Input,
  Label,
  Textarea,
} from '@/src/components/ui';
import { useBriefGeneration } from '@/src/hooks/useBriefGeneration';
import { BriefType, BriefPayload } from '@/src/types/briefe';

interface BriefFormModalProps {
  typ: BriefType;
  isOpen: boolean;
  onClose: () => void;
}

function DialogTitle({ className, children }: { className: string; children: ReactNode }) {
  return <h2 className={className}>{children}</h2>;
}

export function BriefFormModal({ typ, isOpen, onClose }: BriefFormModalProps) {
  const t = useTranslations('briefe.formular');
  const { loading, previewText, generatePreview, downloadPdf } = useBriefGeneration();

  // Formular-Stammdaten-State
  const [absender, setAbsender] = useState({
    name: '',
    strasse: '',
    plz: '',
    ort: '',
    telefon: '',
    email: '',
  });
  const [empfaenger, setEmpfaenger] = useState({
    name: 'Zuständige Behörde / Kasse',
    strasse: '',
    plz: '',
    ort: '',
  });
  const [hauptteil, setHauptteil] = useState('');
  const [betreff, setBetreff] = useState(`Anliegen bezüglich ${typ}`);

  // ============================================================================
  // 🛡️ DYNAMISCHE FRONTEND-VALIDIERUNG
  // ============================================================================

  // Absender muss für das DIN-Layout immer vollständig ausgefüllt sein
  const isAbsenderValid =
    absender.name.trim() !== '' &&
    absender.strasse.trim() !== '' &&
    absender.plz.trim().length === 5 &&
    absender.ort.trim() !== '';

  // E-Mail-Format checken, es sei denn, das Feld ist komplett leer
  const isEmailValid =
    absender.email.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(absender.email);

  // Dynamische Prüfung je nach Brief-Typ (Das "Gehirn" des Modals)
  const isEmpfaengerValid = () => {
    if (typ === 'antrag-pflegegrad' || typ === 'widerspruch-pflegegrad') {
      // Bei Pflegekassen reicht der Name der Institution völlig aus!
      return empfaenger.name.trim() !== '';
    }

    // Bei allgemeinen Briefen, Versorgungsamt oder Erbrecht fordern wir die komplette Anschrift
    return (
      empfaenger.name.trim() !== '' &&
      empfaenger.strasse.trim() !== '' &&
      empfaenger.plz.trim().length === 5 &&
      empfaenger.ort.trim() !== ''
    );
  };

  // Gesamte Validierungs-Kette zusammenführen
  const isFormValid =
    isAbsenderValid && isEmailValid && isEmpfaengerValid() && hauptteil.trim().length >= 10;

  // ============================================================================
  // 📦 PAYLOAD CONVERTER (Bereinigt leere Strings für Zod)
  // ============================================================================
  const assemblePayload = (): BriefPayload => ({
    type: typ,
    absender: {
      ...absender,
      // Leere optionale Felder in undefined wandeln, damit Zod.optional() greift:
      email: absender.email.trim() || undefined,
      telefon: absender.telefon.trim() || undefined,
    },
    empfaenger: {
      ...empfaenger,
    },
    betreff,
    inhalt: {
      anrede: 'Sehr geehrte Damen und Herren,',
      hauptteil,
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border border-white/10 text-white max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl font-sans p-6 sm:p-8">
        <DialogHeader className="pb-4 border-b border-white/5">
          <DialogTitle className="text-xl font-bold text-[#20b2aa] flex items-center gap-2">
            <FileText className="w-5 h-5" /> {t('titel', { typ: typ.toUpperCase() })}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-400">{t('untertitel')}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
          {/* Linke Seite: Datenerfassung */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide">
              {t('absenderTitel')}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">{t('name')}</Label>
                <Input
                  value={absender.name}
                  onChange={(e) => setAbsender({ ...absender, name: e.target.value })}
                  className="bg-slate-900 border-white/10 h-10 text-sm"
                  placeholder="Max Mustermann"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">{t('strasseHausnummer')}</Label>
                <Input
                  value={absender.strasse}
                  onChange={(e) => setAbsender({ ...absender, strasse: e.target.value })}
                  className="bg-slate-900 border-white/10 h-10 text-sm"
                  placeholder="Musterstr. 1"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">{t('plz')}</Label>
                <Input
                  value={absender.plz}
                  onChange={(e) => setAbsender({ ...absender, plz: e.target.value })}
                  className="bg-slate-900 border-white/10 h-10 text-sm"
                  placeholder="12345"
                  maxLength={5}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">{t('ort')}</Label>
                <Input
                  value={absender.ort}
                  onChange={(e) => setAbsender({ ...absender, ort: e.target.value })}
                  className="bg-slate-900 border-white/10 h-10 text-sm"
                  placeholder="Musterstadt"
                />
              </div>
              {/* Optionale Felder für den Absender */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">{t('telefon')}</Label>
                <Input
                  value={absender.telefon}
                  onChange={(e) => setAbsender({ ...absender, telefon: e.target.value })}
                  className="bg-slate-900 border-white/10 h-10 text-sm"
                  placeholder="0151..."
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">{t('email')}</Label>
                <Input
                  value={absender.email}
                  onChange={(e) => setAbsender({ ...absender, email: e.target.value })}
                  className={`bg-slate-900 border-white/10 h-10 text-sm ${!isEmailValid ? 'border-rose-500/50 focus-visible:ring-rose-500' : ''}`}
                  placeholder="max@mustermann.de"
                />
              </div>
            </div>

            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide pt-2">
              {t('empfaengerTitel')}
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">{t('institution')}</Label>
                <Input
                  value={empfaenger.name}
                  onChange={(e) => setEmpfaenger({ ...empfaenger, name: e.target.value })}
                  className="bg-slate-900 border-white/10 h-10 text-sm"
                />
              </div>

              {/* Die Adresszeilen blenden wir optisch aus oder deaktivieren sie, wenn es eine Pflegekasse ist */}
              <div
                className={`grid grid-cols-3 gap-2 transition-opacity duration-200 ${typ === 'antrag-pflegegrad' || typ === 'widerspruch-pflegegrad' ? 'opacity-40' : ''}`}
              >
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs text-gray-400">
                    {t('strasse')}{' '}
                    {typ !== 'antrag-pflegegrad' && typ !== 'widerspruch-pflegegrad' && '*'}
                  </Label>
                  <Input
                    value={empfaenger.strasse}
                    onChange={(e) => setEmpfaenger({ ...empfaenger, strasse: e.target.value })}
                    disabled={typ === 'antrag-pflegegrad' || typ === 'widerspruch-pflegegrad'}
                    placeholder={typ === 'antrag-pflegegrad' ? t('nichtBenoetigt') : ''}
                    className="bg-slate-900 border-white/10 h-10 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">
                    {t('plz')}{' '}
                    {typ !== 'antrag-pflegegrad' && typ !== 'widerspruch-pflegegrad' && '*'}
                  </Label>
                  <Input
                    value={empfaenger.plz}
                    onChange={(e) => setEmpfaenger({ ...empfaenger, plz: e.target.value })}
                    disabled={typ === 'antrag-pflegegrad' || typ === 'widerspruch-pflegegrad'}
                    placeholder={typ === 'antrag-pflegegrad' ? '——' : ''}
                    className="bg-slate-900 border-white/10 h-10 text-sm"
                  />
                </div>
              </div>
            </div>

            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide pt-2">
              {t('inhaltTitel')}
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">{t('betreff')}</Label>
                <Input
                  value={betreff}
                  onChange={(e) => setBetreff(e.target.value)}
                  className="bg-slate-900 border-white/10 h-10 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">{t('begruendung')}</Label>
                <Textarea
                  value={hauptteil}
                  onChange={(e) => setHauptteil(e.target.value)}
                  rows={4}
                  className="bg-slate-900 border-white/10 text-sm resize-none"
                  placeholder={t('begruendungPlatzhalter')}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => generatePreview(assemblePayload())}
                disabled={loading || !isFormValid} // Gekoppelt an isFormValid
                variant="outline"
                className="flex-1 h-11 border-white/10 hover:bg-white/5"
              >
                <Eye className="w-4 h-4 mr-2" /> {t('vorschauText')}
              </Button>
              <Button
                onClick={() => downloadPdf(assemblePayload())}
                disabled={loading || !isFormValid} // Gekoppelt an isFormValid
                className="flex-1 h-11 bg-[#20b2aa] hover:bg-[#3ddbd0] text-slate-950 font-bold"
              >
                <Download className="w-4 h-4 mr-2" /> {t('pdfGenerieren')}
              </Button>
            </div>
          </div>

          {/* Rechte Seite: Live-Text-Preview */}
          <div className="flex flex-col h-full justify-between bg-slate-900/50 border border-white/5 rounded-2xl p-4 min-h-[300px]">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                {t('augeTitel')}
              </h3>
              {previewText ? (
                <div className="font-mono text-[11px] text-gray-300 whitespace-pre-wrap max-h-[400px] overflow-y-auto leading-relaxed bg-slate-950 p-4 rounded-xl border border-white/5">
                  {previewText}
                </div>
              ) : (
                <div className="text-center text-gray-500 text-xs py-20">{t('vorschauLeer')}</div>
              )}
            </div>
            <div className="text-[10px] text-gray-500 border-t border-white/5 pt-3 mt-4">
              {t('vorschauFuss')}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
