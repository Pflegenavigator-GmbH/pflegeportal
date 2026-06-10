// src/app/[locale]/pflegegrad/ergebnis/page.tsx
'use client';

import {
  Download,
  Share2,
  FileText,
  AlertCircle,
  Coins,
  Calculator,
  Accessibility,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { toast } from 'sonner';

// Custom-Hook, Sektionen & Constants Imports

import { HandlungsEmpfehlungen } from '@/src/app/[locale]/pflegegrad/ergebnis/_component/HandlungsEmpfehlung';
import { ModulListe } from '@/src/app/[locale]/pflegegrad/ergebnis/_component/ModulListe';
import { validateAndStoreSession } from '@/src/app/actions/case-session';
import { PaywallModal } from '@/src/components/modal/PaywallModal';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { usePdfDownload } from '@/src/hooks/usePdfDownload';
import { calculatePflegegrad } from '@/src/lib/pflegegrad/rechner';
import { ModuleScores, PflegegradErgebnis, EinstufungAmpel } from '@/src/types/pflegegrad';

import { NBA_MODULE_METADATA } from './_constants/moduleMetadata';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const MVP_PRODUCTS = [
  { id: 'beta_special', name: 'Beta-Special (12 Monate)', price_cents: 2900 },
  { id: 'standard_monthly', name: 'Standard Monatlich', price_cents: 3900 },
  { id: 'standard_yearly', name: 'Standard Jährlich', price_cents: 34900 },
];

export default function ErgebnisPage(props: PageProps) {
  const router = useRouter();
  const params = use(props.params);
  const locale = params?.locale || 'de';

  const [hasMounted, setHasMounted] = useState(false);
  const [ergebnis, setErgebnis] = useState<PflegegradErgebnis | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isVerifyingGdb, setIsVerifyingGdb] = useState(false);

  const [caseCode] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('case_code');
    }
    return null;
  });

  const { downloadPdf, loadingPdf, showPaywall, setShowPaywall } = usePdfDownload({
    caseCode,
    elementId: 'nba-analysis-content',
    documentTitle: `PflegeGutachten_${caseCode?.toUpperCase()}`,
    footerText: 'PflegeNavigator EU gUG — Offizielles Orientierungsgutachten nach § 14 SGB XI',
    fallbackHtml: ergebnis
      ? `<h2>Zusammenfassung</h2><p>Errechneter Pflegegrad: ${ergebnis.careLevel}</p>`
      : undefined,
  });

  useEffect(() => {
    const timer = setTimeout(async () => {
      setHasMounted(true);

      if (!caseCode) {
        toast.error('Keine aktive Fall-Session gefunden.');
        router.push(`/${locale}/pflegegrad/start`);
        return;
      }

      try {
        const session = await validateAndStoreSession(caseCode);
        if (!session.success || !session.isUnlocked) {
          console.log('Session nicht freigeschaltet oder abgelaufen.');
        }
      } catch (sessionErr) {
        console.error('Fehler bei der Server-Session-Synchronisation:', sessionErr);
      }

      const m1 = Number(localStorage.getItem('modul1_rohpunkte') || '0');
      const m2 = Number(localStorage.getItem('modul2_rohpunkte') || '0');
      const m3 = Number(localStorage.getItem('modul3_rohpunkte') || '0');
      const m4 = Number(localStorage.getItem('modul4_rohpunkte') || '0');
      const m5 = Number(localStorage.getItem('modul5_rohpunkte') || '0');
      const m6 = Number(localStorage.getItem('modul6_answers') ? 1 : 0);

      const scores: Partial<ModuleScores> = { 1: m1, 2: m2, 3: m3, 4: m4, 5: m5, 6: m6 };
      const berechnetesErgebnis = calculatePflegegrad(scores);
      setErgebnis(berechnetesErgebnis);

      localStorage.setItem('pflegegrad-ergebnis', JSON.stringify(berechnetesErgebnis));
    }, 0);

    return () => clearTimeout(timer);
  }, [caseCode, locale, router]);

  const handleCheckoutSubmit = async (paketId: string) => {
    if (!caseCode) return;
    setCheckoutLoading(true);
    const toastId = toast.loading('Sicheres Bezahlfenster wird geladen...');

    try {
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseCode: caseCode.toUpperCase(),
          paket: paketId,
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error('Verbindungsfehler zu Stripe.', { id: toastId });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleGdbNavigation = async () => {
    if (!caseCode) return;
    setIsVerifyingGdb(true);
    const verificationToast = toast.loading('Verifiziere aktive Lizenzrechte für Zusatzmodule...');

    try {
      const checkRes = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          caseCode: caseCode.toUpperCase(),
          html: '<li>Lizenzprüfung GdB</li>',
          title: 'CHECK',
        }),
      });

      if (checkRes.status === 402) {
        toast.dismiss(verificationToast);
        setShowPaywall(true);
        setIsVerifyingGdb(false);
        return;
      }

      toast.dismiss(verificationToast);
      router.push(`/${locale}/gdb`);
    } catch {
      toast.error('Verbindungsfehler bei der Lizenzprüfung.', { id: verificationToast });
      setIsVerifyingGdb(false);
    }
  };

  if (!ergebnis) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-white bg-slate-900 min-h-screen flex flex-col justify-center items-center">
        <AlertCircle className="w-16 h-16 text-orange-400 mb-4 animate-pulse" />
        <h1 className="text-2xl font-bold mb-2">Berechne Auswertungs-Matrix...</h1>
        <p className="text-gray-400 max-w-sm">
          Die SGB XI Schwellenwerte werden mit Ihren Angaben abgeglichen.
        </p>
      </div>
    );
  }

  const ampelKonfig: Record<
    EinstufungAmpel,
    { bg: string; text: string; border: string; label: string }
  > = {
    gruen: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      label: 'Sicher über der gesetzlichen Schwelle',
    },
    gelb: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      label: 'Knapp über der gesetzlichen Schwelle (Grenzfall)',
    },
    rot: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      label: 'Unterhalb der gesetzlichen Mindest-Schwelle',
    },
  };

  const aktuelleAmpel = ampelKonfig[ergebnis.trafficLight];

  const shareErgebnis = () => {
    if (navigator.share && caseCode) {
      navigator
        .share({
          title: 'Pflegegrad-Orientierungswert',
          text: `Voraussichtlicher Pflegegrad: ${ergebnis.careLevel} mit ${ergebnis.totalScore} Punkten.`,
          url: window.location.href,
        })
        .catch(() => toast.error('Teilen fehlgeschlagen.'));
    } else {
      toast.info('Link in die Zwischenablage kopiert.');
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 py-12 px-4 text-white font-sans">
      <div id="nba-analysis-content" className="container mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ihre NBA-Leistungsanalyse</h1>
            <p className="text-sm text-gray-400 mt-1">
              Ermittelt nach den Begutachtungs-Richtlinien
            </p>
          </div>
          {hasMounted && caseCode && (
            <span className="text-xs font-mono bg-white/5 border border-white/10 px-3 py-1 rounded-full text-gray-400">
              Akte: {caseCode}
            </span>
          )}
        </div>

        <Card className={`bg-white/5 border-2 ${aktuelleAmpel.border} text-white shadow-2xl`}>
          <div className="p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center sm:text-left">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase ${aktuelleAmpel.bg} ${aktuelleAmpel.text}`}
              >
                {aktuelleAmpel.label}
              </span>
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                {ergebnis.careLevel === 0 ? 'Kein Pflegegrad' : `Pflegegrad ${ergebnis.careLevel}`}
              </h2>
              <p className="text-sm text-gray-400 max-w-md">
                Punktwert: {ergebnis.totalScore.toFixed(1)} von 100.
              </p>
            </div>
            <div
              className={`w-28 h-28 rounded-2xl ${aktuelleAmpel.bg} border ${aktuelleAmpel.border} flex items-center justify-center flex-shrink-0`}
            >
              <AlertCircle className={`w-14 h-14 ${aktuelleAmpel.text}`} />
            </div>
          </div>
        </Card>

        {ergebnis.careLevel > 0 && (
          <Card className="bg-white/5 border-white/10 text-white shadow-xl">
            <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#20b2aa]" /> Leistungsansprüche
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4 sm:grid-cols-2 mb-4">
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                  <span className="text-xs text-gray-400">Pflegegeld</span>
                  <p className="text-2xl font-bold">{ergebnis.benefits.monthlyAmount} €</p>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                  <span className="text-xs text-gray-400">Entlastungsbetrag</span>
                  <p className="text-2xl font-bold">{ergebnis.benefits.reliefBudget} €</p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => router.push(`/${locale}/kombileistungen`)}
                className="w-full h-12 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl"
              >
                <Calculator className="w-4 h-4 mr-2" /> Kombi-Rechner starten
              </Button>
            </CardContent>
          </Card>
        )}

        <ModulListe metadata={NBA_MODULE_METADATA} ergebnis={ergebnis} />
        <HandlungsEmpfehlungen ergebnis={ergebnis} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button
            variant="outline"
            onClick={downloadPdf}
            disabled={loadingPdf}
            className="h-14 border-white/10 text-white hover:bg-white/5 shadow-md"
          >
            <Download className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button
            variant="outline"
            onClick={shareErgebnis}
            className="h-14 border-white/10 text-white hover:bg-white/5 shadow-md"
          >
            <Share2 className="w-4 h-4 mr-2" /> Teilen
          </Button>
          <Button
            onClick={() => router.push(`/${locale}/briefe`)}
            className="h-14 bg-[#20b2aa] hover:bg-[#3ddbd0] text-white font-bold shadow-xl"
          >
            <FileText className="w-4 h-4 mr-2" /> Briefe
          </Button>
        </div>

        <Card className="bg-gradient-to-r from-white/5 to-transparent border-white/10 text-white p-5 rounded-xl shadow-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Accessibility className="w-4 h-4 text-[#20b2aa]" /> Grad der Behinderung prüfen?
              </h4>
              <p className="text-gray-400 text-xs">
                Erhalten Sie Steuerfreibeträge und Zusatzurlaub.
              </p>
            </div>
            <Button
              onClick={handleGdbNavigation}
              disabled={isVerifyingGdb}
              className="bg-[#20b2aa] hover:bg-[#3ddbd0] text-slate-950 font-bold text-xs h-10 rounded-xl"
            >
              {isVerifyingGdb ? 'Prüfe...' : 'GdB-Rechner'}
            </Button>
          </div>
        </Card>

        {showPaywall && (
          <PaywallModal
            caseCode={caseCode || ''}
            isExpired={false}
            products={MVP_PRODUCTS}
            onCheckout={handleCheckoutSubmit}
            onClose={() => setShowPaywall(false)}
            loading={checkoutLoading}
          />
        )}
      </div>
    </main>
  );
}
