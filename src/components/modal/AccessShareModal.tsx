// src/components/modal/AccessShareModal.tsx
'use client';

import {
  Mail,
  Smartphone,
  Download,
  Loader2,
  MessageCircle,
  Share2,
  ShieldAlert,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';

interface AccessShareModalProps {
  caseCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccessShareModal({ caseCode, open, onOpenChange }: AccessShareModalProps) {
  const params = useParams();
  const locale = typeof params?.locale === 'string' ? params.locale : 'de';
  const [contactType, setContactType] = useState<'email' | 'sms'>('email');
  const [contactValue, setContactValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  // Brevo Versand (Nur für den Nutzer selbst)
  const handleSendToSelf = async () => {
    if (!contactValue) return toast.error('Bitte geben Sie einen Empfänger an.');
    setIsLoading(true);

    try {
      const res = await fetch('/api/send-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseCode, contact: contactValue, type: contactType, locale }),
      });

      if (!res.ok) throw new Error();

      toast.success(`Link erfolgreich per ${contactType === 'email' ? 'E-Mail' : 'SMS'} gesendet!`);
      onOpenChange(false);
      setContactValue('');
    } catch (error) {
      toast.error('Versand fehlgeschlagen. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsLoading(false);
    }
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
      toast.success('Link in die Zwischenablage kopiert!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f2744] text-white border-white/10 sm:max-w-md p-0 overflow-hidden">
        <div className="max-h-[90vh] overflow-y-auto px-5 py-5">
          <DialogHeader className="pr-10">
            <DialogTitle className="text-2xl font-semibold">Fall-Zugang verwalten</DialogTitle>
            <DialogDescription className="text-slate-400 mt-2 leading-relaxed">
              Speichern Sie den Zugang für sich selbst oder teilen Sie ihn sicher mit Angehörigen.
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
              QR-Code ausdrucken / speichern
            </Button>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#20b2aa]">
              <Share2 className="h-4 w-4" />
              Mit Angehörigen teilen
            </h3>

            <Button
              onClick={handleNativeShare}
              className="h-12 w-full border border-[#25D366]/40 bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Über eigene Apps teilen
            </Button>

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-white/5 bg-slate-950/40 p-3 text-slate-400">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-[11px] leading-relaxed">
                <strong className="text-amber-500">Eigenverantwortung:</strong> Dieser Button öffnet
                das Nachrichten-Programm Ihres eigenen Geräts. Bitte teilen Sie den Link
                ausschließlich mit Personen Ihres Vertrauens.
              </p>
            </div>
          </div>

          <div className="my-6 border-t border-white/10" />

          <div className="space-y-4 pb-1">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#20b2aa]">
              <Mail className="h-4 w-4" />
              Backup an mich selbst senden
            </h3>

            <div className="flex overflow-hidden rounded-xl border border-white/10 bg-slate-950/60 p-1">
              <button
                onClick={() => setContactType('email')}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  contactType === 'email'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Mail className="mr-2 inline h-4 w-4" />
                E-Mail
              </button>

              <button
                onClick={() => setContactType('sms')}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  contactType === 'sms'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Smartphone className="mr-2 inline h-4 w-4" />
                SMS
              </button>
            </div>

            <div className="flex gap-2">
              <Input
                type={contactType === 'email' ? 'email' : 'tel'}
                placeholder={contactType === 'email' ? 'meine@email.de' : '+49 151 ...'}
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                className="h-12 flex-1 bg-slate-950/60 border-white/10 focus-visible:ring-slate-600"
              />
              <Button
                onClick={handleSendToSelf}
                disabled={isLoading}
                className="h-12 min-w-[96px] bg-slate-700 px-6 font-bold text-white hover:bg-slate-600"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Senden'}
              </Button>
            </div>

            <p className="px-2 text-center text-[11px] leading-relaxed text-slate-400">
              🔒 <strong>Datenschutz:</strong> Ihre Kontaktdaten werden{' '}
              <span className="underline decoration-slate-500 underline-offset-2">nicht</span> in
              unserer Datenbank gespeichert. Sie werden ausschließlich für diesen einmaligen Versand
              genutzt.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
