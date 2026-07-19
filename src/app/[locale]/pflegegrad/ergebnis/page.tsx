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
  FolderLock,
  RefreshCw,
  ChevronDown,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { toast } from 'sonner';

import { HandlungsEmpfehlungen } from '@/src/app/[locale]/pflegegrad/ergebnis/_component/HandlungsEmpfehlung';
import { ModulListe } from '@/src/app/[locale]/pflegegrad/ergebnis/_component/ModulListe';
import { PaywallModal } from '@/src/components/modal/PaywallModal';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { usePdfDownload } from '@/src/hooks/usePdfDownload';
import { logger } from '@/src/lib/logger';
import { loadCaseResult, SessionExpiredError } from '@/src/lib/pflegegrad/client-api';
import { PflegegradErgebnis, EinstufungAmpel } from '@/src/types/pflegegrad';

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);

    if (!caseCode) {
      logger.warn('Keine aktive Fall-Session gefunden. Leite um.');
      toast.error('Keine aktive Fall-Session gefunden.');
      router.push(`/${locale}/pflegegrad/start`);
      return;
    }

    // Server ist die einzige Wahrheit: Rohpunkte und Pflegegrad werden
    // serverseitig aus den gespeicherten Antworten berechnet — kein
    // localStorage, kein setTimeout-Lifecycle-Workaround mehr.
    loadCaseResult(caseCode)
      .then((berechnetesErgebnis) => {
        setErgebnis(berechnetesErgebnis);
      })
      .catch((err) => {
        if (err instanceof SessionExpiredError) {
          toast.error('Ihre Fall-Session ist abgelaufen. Bitte laden Sie Ihren Fall erneut.');
          router.push(`/${locale}/pflegegrad/start`);
          return;
        }
        logger.error({ err, caseCode }, 'Ergebnis konnte nicht geladen werden');
        toast.error('Das Ergebnis konnte nicht berechnet werden.');
      });
  }, [caseCode, locale, router]);

  const handleReEvaluateFromScratch = () => {
    if (
      confirm(
        'Möchten Sie die aktuelle Einstufung wirklich zurücksetzen und alle Fragen von vorne beantworten? Ihre bisherigen Modul-Antworten werden überschrieben.'
      )
    ) {
      logger.info({ caseCode }, 'Trigger Re-Evaluation: Säubere lokalen Cache und starte neu');
      for (let i = 1; i <= 6; i++) {
        localStorage.removeItem(`modul${i}_rohpunkte`);
        localStorage.removeItem(`modul${i}_answers`);
      }
      localStorage.removeItem('pflegegrad-ergebnis');
      toast.success('Evaluierung zurückgesetzt.');
      router.push(`/${locale}/pflegegrad/modul1`);
    }
  };

  const handleCheckoutSubmit = async (paketId: string) => {
    if (!caseCode) return;
    setCheckoutLoading(true);
    logger.info({ caseCode, paketId }, 'Starte Stripe Checkout Erstellung aus der Paywall heraus');
    const toastId = toast.loading('Sicheres Bezahlfenster wird geladen...');

    try {
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseCode: caseCode.toUpperCase(),
          paket: paketId,
          locale,
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      logger.error({ err, caseCode }, 'Stripe Session-Erstellung serverseitig fehlgeschlagen');
      toast.error('Verbindungsfehler zu Stripe.', { id: toastId });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleGdbNavigation = async () => {
    if (!caseCode) return;
    setIsVerifyingGdb(true);
    logger.debug({ caseCode }, 'Verifiziere GdB-Lizenzfreigabe');
    const verificationToast = toast.loading('Verifiziere aktive Lizenzrechte für Zusatzmodule...');

    try {
      // Leichtgewichtige Statusabfrage — kein Puppeteer, kein Cache-Eintrag
      const checkRes = await fetch(`/api/cases/${caseCode.toUpperCase()}/access`, {
        credentials: 'include',
      });
      const accessData = checkRes.ok ? await checkRes.json() : null;

      if (checkRes.status === 402 || (accessData && !accessData.isUnlocked)) {
        logger.info({ caseCode }, 'Lizenz fehlt für GdB-Zusatzmodul. Zeige Paywall.');
        toast.dismiss(verificationToast);
        setShowPaywall(true);
        setIsVerifyingGdb(false);
        return;
      }

      toast.dismiss(verificationToast);
      router.push(`/${locale}/gdb`);
    } catch (err) {
      logger.error({ err }, 'GdB Lizenzcheck-Verbindung abgebrochen');
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ihre NBA-Leistungsanalyse</h1>
            <p className="text-sm text-gray-400 mt-1">
              Ermittelt nach den Begutachtungs-Richtlinien
            </p>
          </div>

          {/* 📁 NEUES AKTEN-DROPDOWN-MENÜ */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            {hasMounted && caseCode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="text-xs font-mono bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full text-gray-300 flex items-center gap-2 cursor-pointer transition-colors select-none">
                    <FolderLock className="w-3.5 h-3.5 text-[#20b2aa]" />
                    <span>Akte: {caseCode.toUpperCase()}</span>
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="bg-slate-900 border-white/10 text-white w-56"
                  align="end"
                >
                  <DropdownMenuLabel className="text-xs text-gray-400">
                    Akten-Optionen
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem
                    onClick={handleReEvaluateFromScratch}
                    className="text-rose-400 focus:text-rose-400 focus:bg-rose-500/10 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-2" /> Neu evaluieren
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Ampel-Card */}
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

        {/* ℹ️ BARRIEREFREIE PARAGRAPHEN-ERKLÄRUNG FÜR SENIOREN */}
        <Card className="bg-white/[0.02] border border-white/5 text-white shadow-md p-5 rounded-2xl">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-[#20b2aa] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-gray-200">
                Wie kommt mein Pflegegrad zustande? (Einfach erklärt)
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Ein Pflegegrad wird im Gesetz nicht nach Minuten oder Stunden bemessen, sondern rein
                nach Ihrer verbleibenden
                <strong> Eigenständigkeit im Alltag</strong>. Das Begutachtungssystem verteilt
                Punkte in den unten stehenden Lebensbereichen. Ab 12.5 Punkten erhalten Sie
                Pflegegrad 1, ab 27 Punkten Pflegegrad 2, ab 47.5 Punkten Pflegegrad 3, ab 70
                Punkten Pflegegrad 4 und ab 90 Punkten den höchsten Pflegegrad 5.
              </p>
            </div>
          </div>
        </Card>

        {/* ============================================================================
              💰 LEISTUNGSANSPRÜCHE: SGB XI ABSTUFUNG (Rechtssicher nach § 38)
             ============================================================================ */}

        {/* ZUSTAND A: KLASSISCHE KOMBINATIONSPFLEGE (Pflegegrad 2 bis 5) */}
        {ergebnis.careLevel >= 2 && (
          <Card className="bg-white/5 border-white/10 text-white shadow-xl">
            <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#20b2aa]" /> Leistungsansprüche & Kombinationspflege
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4 sm:grid-cols-2 mb-4">
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                  <span className="text-xs text-gray-400">Pflegegeld (SGB XI § 37)</span>
                  <p className="text-2xl font-bold">{ergebnis.benefits.monthlyAmount} €</p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Bei privater Pflege durch Angehörige
                  </p>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                  <span className="text-xs text-gray-400">Entlastungsbetrag (SGB XI § 45b)</span>
                  <p className="text-2xl font-bold">{ergebnis.benefits.reliefBudget} €</p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Zweckgebunden für Betreuungsdienste
                  </p>
                </div>
              </div>

              {/* Kombi-Rechner wird nur hier angeboten, da rechtlich erst ab PG 2 zulässig */}
              <Button
                variant="ghost"
                onClick={() => router.push(`/${locale}/kombileistungen`)}
                className="w-full h-12 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl flex items-center justify-center font-semibold text-sm transition-colors"
              >
                <Calculator className="w-4 h-4 mr-2" /> Sachleistungen aufteilen (Kombi-Rechner)
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ZUSTAND B: SONDERFALL PFLEGEGRAD 1 (Kein Kombi-Budget vorhanden) */}
        {ergebnis.careLevel === 1 && (
          <Card className="bg-white/5 border-white/10 text-white shadow-xl">
            <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-amber-400">
                <Info className="w-5 h-5" /> Ihre Ansprüche bei Pflegegrad 1
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <span className="text-xs text-gray-400">
                  Monatlicher Entlastungsbetrag (§ 45b SGB XI)
                </span>
                <p className="text-2xl font-bold text-white">{ergebnis.benefits.reliefBudget} €</p>
                <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                  Bei Pflegegrad 1 zahlt die Kasse noch kein direktes Pflegegeld aus. Sie erhalten
                  jedoch den vollen Entlastungsbetrag. Dieser ist zweckgebunden und kann für
                  zugelassene Alltagsbegleiter, Haushaltshilfen oder Tagespflege erstattet werden.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ZUSTAND C: KEIN PFLEGEGRAD (Pflegegrad 0 – Keine finanziellen Ansprüche) */}
        {ergebnis.careLevel === 0 && (
          <Card className="bg-rose-500/5 border border-rose-500/20 text-white shadow-xl p-6 rounded-2xl flex gap-4 items-start">
            <AlertCircle className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-rose-400">Hinweis zum aktuellen Punktestand</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Mit Ihrem errechneten Wert von {ergebnis.totalScore} Punkten wird die gesetzliche
                Mindesthürde von 12,5 Punkten für eine Einstufung aktuell unterschritten. Sollte
                sich der Zustand im Alltag verschlechtern, empfiehlt es sich, die Evaluierung
                umgehend mit den neuen Gegebenheiten zu wiederholen.
              </p>
            </div>
          </Card>
        )}

        {/* Modul-Liste */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              Modul-Einstufung anpassen
            </h3>
            <span className="text-xs text-[#20b2aa]">Klicken zum Editieren</span>
          </div>
          <ModulListe metadata={NBA_MODULE_METADATA} ergebnis={ergebnis} locale={locale} />
        </div>

        <HandlungsEmpfehlungen ergebnis={ergebnis} />

        {/* Zusatzleistungen anzeigen (Wohnraum, Hilfsmittel), falls im Rechner-Ergebnis vorhanden */}
        {ergebnis.benefits.additionalBenefits.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
              Zusätzliche gesetzliche Hilfen
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {ergebnis.benefits.additionalBenefits.map((benefit, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-gray-300 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#20b2aa] flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer-Actions */}
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

        {/* GdB-Weiche */}
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
