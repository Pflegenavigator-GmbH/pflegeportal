// src/components/modal/AccessShareModal.tsx
'use client';

// Der Versand des Zugangs per E-Mail oder SMS über Brevo ist am 14.09.2026
// entfernt worden: Er schickte das dauerhafte Zugangsmittel an einen
// Dienstleister, dessen Bedingungen Gesundheitsdaten ausschließen
// (Gutachtenauftrag A24, ADR-0002). QR-Code und Teilen bleiben bis zur
// Wiederherstellung nach #134 bestehen.

import { Download, MessageCircle, Share2, ShieldAlert } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui';

interface AccessShareModalProps {
  caseCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccessShareModal({ caseCode, open, onOpenChange }: AccessShareModalProps) {
  const t = useTranslations('common.akteTeilen');
  const params = useParams();
  const locale = typeof params?.locale === 'string' ? params.locale : 'de';

  const portalLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/${locale}/pflegegrad/start?case=${encodeURIComponent(caseCode)}`
      : `https://pflegenavigatoreu.com/${locale}/pflegegrad/start?case=${encodeURIComponent(caseCode)}`;

  const handleDownloadQR = () => {
    const svg = document.getElementById('access-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `PflegeNavigator-${caseCode}.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  // DSGVO-konformes Teilen (Öffnet native Apps des Nutzers)
  const handleNativeShare = async () => {
    const shareData = {
      title: 'Zugang zum PflegeNavigator',
      text: `Hier ist unser gemeinsamer Zugang zum Pflegetagebuch. Fallnummer: ${caseCode}`,
      url: portalLink,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Erfolgreich geteilt!');
      } catch (err) {
        console.log('Teilen abgebrochen', err);
      }
    } else {
      // Fallback für Desktop: In die Zwischenablage kopieren
      navigator.clipboard.writeText(`${shareData.text} \n\n${shareData.url}`);
      toast.success(t('linkKopiert'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f2744] text-white border-white/10 sm:max-w-md p-0 overflow-hidden">
        <div className="max-h-[90vh] overflow-y-auto px-5 py-5">
          <DialogHeader className="pr-10">
            <DialogTitle className="text-2xl font-semibold">{t('titel')}</DialogTitle>
            <DialogDescription className="text-slate-400 mt-2 leading-relaxed">
              {t('untertitel')}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/5 bg-slate-950/40 px-4 py-6">
            <div className="rounded-2xl bg-white p-3 shadow-lg">
              <QRCodeSVG
                id="access-qr-code"
                value={portalLink}
                size={180}
                bgColor="#ffffff"
                fgColor="#0f2744"
                level="H"
              />
            </div>

            <Button
              onClick={handleDownloadQR}
              variant="ghost"
              size="sm"
              className="h-11 text-gray-300 hover:bg-white/10 hover:text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              {t('qrSpeichern')}
            </Button>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#20b2aa]">
              <Share2 className="h-4 w-4" />
              {t('teilenTitel')}
            </h3>

            <Button
              onClick={handleNativeShare}
              className="h-12 w-full border border-[#25D366]/40 bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              {t('appsTeilen')}
            </Button>

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-white/5 bg-slate-950/40 p-3 text-slate-400">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-[11px] leading-relaxed">
                <strong className="text-amber-500">{t('eigenverantwortung')}</strong>{' '}
                {t('eigenverantwortungText')}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
