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
  CalendarClock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState, use } from 'react';
import { toast } from 'sonner';

import { HandlungsEmpfehlungen } from '@/src/app/[locale]/pflegegrad/ergebnis/_component/HandlungsEmpfehlung';
import { ModulListe } from '@/src/app/[locale]/pflegegrad/ergebnis/_component/ModulListe';
import { BescheidDatumAbfrage, FristenMonitor } from '@/src/components/fristen';
import { BestaetigungsDialog } from '@/src/components/modal/BestaetigungsDialog';
import { PaywallModal } from '@/src/components/modal/PaywallModal';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui';
import { useBescheidDatum } from '@/src/hooks/useBescheidDatum';
import { usePdfDownload } from '@/src/hooks/usePdfDownload';
import { useStripeCheckout } from '@/src/hooks/useStripeCheckout';
import { logger } from '@/src/lib/logger';
import {
  IncompleteAssessmentError,
  loadCaseResult,
  SessionExpiredError,
} from '@/src/lib/pflegegrad/client-api';
import { entferneErgebnis } from '@/src/lib/pflegegrad/ergebnis-storage';
import { berechneFristen } from '@/src/lib/widerspruch/fristen';
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
  const tMeldung = useTranslations('pflegegrad.meldungen');
  const t = useTranslations('pflegegrad.ergebnis');
  const tCommon = useTranslations('common.buttons');
  const router = useRouter();
  const params = use(props.params);
  const locale = params?.locale || 'de';

  const [hasMounted, setHasMounted] = useState(false);
  const [ergebnis, setErgebnis] = useState<PflegegradErgebnis | null>(null);
  const [loadError, setLoadError] = useState(false);
  const { triggerCheckout, checkoutLoading } = useStripeCheckout();
  const [isVerifyingGdb, setIsVerifyingGdb] = useState(false);
  const [resetDialogOffen, setResetDialogOffen] = useState(false);
  const [resetLaeuft, setResetLaeuft] = useState(false);

  const [caseCode] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('case_code');
    }
    return null;
  });

  const {
    bescheidDatum,
    speichereBescheidDatum,
    speichert: speichertDatum,
  } = useBescheidDatum(caseCode);

  // Fristen ergeben sich rein rechnerisch aus dem Bescheiddatum — kein
  // Serveraufruf nötig, die Anzeige folgt der Eingabe unmittelbar.
  const fristenUebersicht = useMemo(() => berechneFristen({ bescheidDatum }), [bescheidDatum]);

  const { downloadPdf, loadingPdf, showPaywall, setShowPaywall } = usePdfDownload({
    caseCode,
    elementId: 'nba-analysis-content',
    documentTitle: `PflegeGutachten_${caseCode?.toUpperCase()}`,
    footerText: 'PflegeNavigator EU gUG — Offizielles Orientierungsgutachten nach § 14 SGB XI',
    fallbackHtml: ergebnis
      ? `<h2>{t('zusammenfassung')}</h2><p>Errechneter Pflegegrad: ${ergebnis.careLevel}</p>`
      : undefined,
  });

  const ladeErgebnis = useCallback(async () => {
    if (!caseCode) {
      logger.warn('Keine aktive Fall-Session gefunden. Leite um.');
      toast.error(tMeldung('keineSitzungKurz'));
      router.push(`/${locale}/pflegegrad/start`);
      return;
    }

    setLoadError(false);
    try {
      const berechnetesErgebnis = await loadCaseResult(caseCode);
      setErgebnis(berechnetesErgebnis);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        toast.error(tMeldung('sitzungAbgelaufen'));
        router.push(`/${locale}/pflegegrad/start`);
        return;
      }
      if (err instanceof IncompleteAssessmentError) {
        router.replace(`/${locale}/pflegegrad/modul${err.nextModule}`);
        return;
      }
      logger.error({ err, caseCode }, 'Ergebnis konnte nicht geladen werden');
      setLoadError(true);
      toast.error(tMeldung('ergebnisFehler'));
    }
  }, [caseCode, locale, router, tMeldung]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);
    void ladeErgebnis();
  }, [ladeErgebnis]);

  /**
   * Setzt die Begutachtung zurück.
   *
   * Der Löschauftrag geht an den Server: Die Antworten liegen in der
   * `answers`-Tabelle, nicht im Browser. Ein reines Leeren des localStorage
   * (so lief es früher) hat nichts zurückgesetzt — die Module luden ihre
   * alten Antworten anschließend wieder vom Server.
   */
  const handleReEvaluateFromScratch = async () => {
    if (!caseCode) return;

    setResetLaeuft(true);
    try {
      const antwort = await fetch(`/api/cases/${caseCode.toUpperCase()}/answers`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!antwort.ok) throw new Error(`Status ${antwort.status}`);

      // Zwischenstände früherer Versionen mit aufräumen
      for (let i = 1; i <= 6; i++) {
        localStorage.removeItem(`modul${i}_rohpunkte`);
        localStorage.removeItem(`modul${i}_answers`);
      }
      entferneErgebnis();

      logger.info({ caseCode }, 'Begutachtung zurückgesetzt, starte neu bei Modul 1');
      toast.success(tMeldung('zurueckgesetzt'));

      // Ladezustand bewusst aktiv lassen — die Navigation folgt unmittelbar.
      router.push(`/${locale}/pflegegrad/modul1`);
    } catch (error) {
      logger.error({ error, caseCode }, 'Begutachtung konnte nicht zurückgesetzt werden');
      toast.error(tMeldung('zuruecksetzenFehler'));
      setResetLaeuft(false);
      setResetDialogOffen(false);
    }
  };

  const handleCheckoutSubmit = (paketId: string) => triggerCheckout(caseCode, paketId);

  const handleGdbNavigation = async () => {
    if (!caseCode) return;
    setIsVerifyingGdb(true);
    logger.debug({ caseCode }, 'Verifiziere GdB-Lizenzfreigabe');
    const verificationToast = toast.loading(t('lizenzPruefen'));

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
      toast.error(t('lizenzFehler'), { id: verificationToast });
      setIsVerifyingGdb(false);
    }
  };

  if (!ergebnis) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-white bg-[var(--color-surface)] min-h-screen flex flex-col justify-center items-center">
        <AlertCircle
          className={`w-16 h-16 text-orange-400 mb-4 ${loadError ? '' : 'animate-pulse'}`}
        />
        <h1 className="text-2xl font-bold mb-2">
          {loadError ? tMeldung('ergebnisFehler') : t('ladenTitel')}
        </h1>
        {!loadError && <p className="text-[var(--color-text-muted)] max-w-sm">{t('ladenText')}</p>}
        {loadError && (
          <div className="flex flex-wrap justify-center gap-3 mt-5">
            <Button onClick={() => void ladeErgebnis()}>{tCommon('retry')}</Button>
            <Button variant="outline" onClick={() => router.push(`/${locale}/pflegegrad/start`)}>
              {tCommon('back')}
            </Button>
          </div>
        )}
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
      label: t('ampel.gruen'),
    },
    gelb: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      label: t('ampel.gelb'),
    },
    rot: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      label: t('ampel.rot'),
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
        .catch(() => toast.error(tMeldung('teilenFehler')));
    } else {
      toast.info(tMeldung('linkKopiert'));
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--color-surface)] py-12 px-4 text-white font-sans">
      <div id="nba-analysis-content" className="container mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('seitenTitel')}</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">{t('seitenUntertitel')}</p>
          </div>

          {/* 📁 NEUES AKTEN-DROPDOWN-MENÜ */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            {hasMounted && caseCode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="text-xs font-mono bg-[var(--surface-1)] hover:bg-white/10 border border-[var(--border-subtle)] px-3 py-1.5 rounded-full text-[var(--color-text-subtle)] flex items-center gap-2 cursor-pointer transition-colors select-none">
                    <FolderLock className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                    <span>Akte: {caseCode.toUpperCase()}</span>
                    <ChevronDown className="w-3 h-3 text-[var(--color-text-faint)]" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="bg-[var(--color-surface)] border-[var(--border-subtle)] text-white w-56"
                  align="end"
                >
                  <DropdownMenuLabel className="text-xs text-[var(--color-text-muted)]">
                    {t('aktenOptionen')}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[var(--surface-1)]" />
                  <DropdownMenuItem
                    onClick={() => setResetDialogOffen(true)}
                    className="text-rose-400 focus:text-rose-400 focus:bg-rose-500/10 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-2" /> {t('neuEvaluieren')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Ampel-Card */}
        <Card
          className={`bg-[var(--surface-1)] border-2 ${aktuelleAmpel.border} text-white shadow-2xl`}
        >
          <div className="p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center sm:text-left">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase ${aktuelleAmpel.bg} ${aktuelleAmpel.text}`}
              >
                {aktuelleAmpel.label}
              </span>
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                {ergebnis.careLevel === 0
                  ? t('keinPflegegrad')
                  : t('pflegegradN', { stufe: ergebnis.careLevel })}
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] max-w-md">
                {t('punktwert', { punkte: ergebnis.totalScore.toFixed(1) })}
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
        <Card className="bg-[var(--surface-hairline)] border border-[var(--border-faint)] text-white shadow-md p-5 rounded-2xl">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-gray-200">{t('erklaerungTitel')}</h4>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                {t.rich('erklaerungText', { b: (inhalt) => <strong>{inhalt}</strong> })}
              </p>
            </div>
          </div>
        </Card>

        {/* ============================================================================
              💰 LEISTUNGSANSPRÜCHE: SGB XI ABSTUFUNG (Rechtssicher nach § 38)
             ============================================================================ */}

        {/* ZUSTAND A: KLASSISCHE KOMBINATIONSPFLEGE (Pflegegrad 2 bis 5) */}
        {ergebnis.careLevel >= 2 && (
          <Card className="bg-[var(--surface-1)] border-[var(--border-subtle)] text-white shadow-xl">
            <CardHeader className="border-b border-[var(--border-faint)] pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Coins className="w-5 h-5 text-[var(--color-accent)]" /> {t('anspruecheTitel')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4 sm:grid-cols-2 mb-4">
                <div className="p-4 bg-[var(--surface-hairline)] border border-[var(--border-faint)] rounded-xl">
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {t('pflegegeldLabel')}
                  </span>
                  <p className="text-2xl font-bold">{ergebnis.benefits.monthlyAmount} €</p>
                  <p className="text-[10px] text-[var(--color-text-faint)] mt-1">
                    {t('pflegegeldHinweis')}
                  </p>
                </div>
                <div className="p-4 bg-[var(--surface-hairline)] border border-[var(--border-faint)] rounded-xl">
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {t('entlastungLabel')}
                  </span>
                  <p className="text-2xl font-bold">{ergebnis.benefits.reliefBudget} €</p>
                  <p className="text-[10px] text-[var(--color-text-faint)] mt-1">
                    {t('entlastungHinweis')}
                  </p>
                </div>
              </div>

              {/* Kombi-Rechner wird nur hier angeboten, da rechtlich erst ab PG 2 zulässig */}
              <Button
                variant="ghost"
                onClick={() => router.push(`/${locale}/kombileistungen`)}
                className="w-full h-12 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl flex items-center justify-center font-semibold text-sm transition-colors"
              >
                <Calculator className="w-4 h-4 mr-2" /> {t('kombiRechner')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ZUSTAND B: SONDERFALL PFLEGEGRAD 1 (Kein Kombi-Budget vorhanden) */}
        {ergebnis.careLevel === 1 && (
          <Card className="bg-[var(--surface-1)] border-[var(--border-subtle)] text-white shadow-xl">
            <CardHeader className="border-b border-[var(--border-faint)] pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-amber-400">
                <Info className="w-5 h-5" /> {t('pg1Titel')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="p-4 bg-[var(--surface-hairline)] border border-[var(--border-faint)] rounded-xl">
                <span className="text-xs text-[var(--color-text-muted)]">
                  {t('pg1EntlastungLabel')}
                </span>
                <p className="text-2xl font-bold text-white">{ergebnis.benefits.reliefBudget} €</p>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
                  {t('pg1Text')}
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
              <h4 className="font-bold text-sm text-rose-400">{t('pg0Titel')}</h4>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                {t('pg0Text', { punkte: ergebnis.totalScore })}
              </p>
            </div>
          </Card>
        )}

        {/* Modul-Liste */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              {t('moduleTitel')}
            </h3>
            <span className="text-xs text-[var(--color-accent)]">{t('moduleEditieren')}</span>
          </div>
          <ModulListe metadata={NBA_MODULE_METADATA} ergebnis={ergebnis} locale={locale} />
        </div>

        <HandlungsEmpfehlungen ergebnis={ergebnis} />

        {/* Fristen-Monitor: Nach dem Ergebnis entscheidet sich, ob widersprochen
            wird — hier ist die Widerspruchsfrist relevant, nicht erst im
            Widerspruchs-Zentrum. Das Datum wird bewusst erfragt, nie geraten. */}
        <Card className="bg-white/5 border-white/10 text-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-[var(--color-accent)]" /> {t('fristenTitel')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <BescheidDatumAbfrage
              wert={bescheidDatum}
              onChange={speichereBescheidDatum}
              gespeichertWird={speichertDatum}
            />
            <FristenMonitor uebersicht={fristenUebersicht} />
          </CardContent>
        </Card>

        {/* Zusatzleistungen anzeigen (Wohnraum, Hilfsmittel), falls im Rechner-Ergebnis vorhanden */}
        {ergebnis.benefits.additionalBenefits.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider px-1">
              {t('zusatzTitel')}
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {ergebnis.benefits.additionalBenefits.map((benefit, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[var(--surface-hairline)] border border-[var(--border-faint)] rounded-xl text-xs text-[var(--color-text-subtle)] flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)] flex-shrink-0" />
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
            className="h-14 border-[var(--border-subtle)] text-white hover:bg-[var(--surface-1)] shadow-md"
          >
            <Download className="w-4 h-4 mr-2" /> {t('pdf')}
          </Button>
          <Button
            variant="outline"
            onClick={shareErgebnis}
            className="h-14 border-[var(--border-subtle)] text-white hover:bg-[var(--surface-1)] shadow-md"
          >
            <Share2 className="w-4 h-4 mr-2" /> {t('teilen')}
          </Button>
          <Button
            onClick={() => router.push(`/${locale}/briefe`)}
            className="h-14 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-bold shadow-xl"
          >
            <FileText className="w-4 h-4 mr-2" /> {t('briefe')}
          </Button>
        </div>

        {/* GdB-Weiche */}
        <Card className="bg-gradient-to-r from-white/5 to-transparent border-[var(--border-subtle)] text-white p-5 rounded-xl shadow-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Accessibility className="w-4 h-4 text-[var(--color-accent)]" /> {t('gdbTitel')}
              </h4>
              <p className="text-[var(--color-text-muted)] text-xs">{t('gdbText')}</p>
            </div>
            <Button
              onClick={handleGdbNavigation}
              disabled={isVerifyingGdb}
              className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-bold text-xs h-10 rounded-xl"
            >
              {isVerifyingGdb ? t('gdbPruefen') : t('gdbRechner')}
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

        <BestaetigungsDialog
          offen={resetDialogOffen}
          onAbbrechen={() => setResetDialogOffen(false)}
          onBestaetigen={handleReEvaluateFromScratch}
          destruktiv
          titel={t('reset.titel')}
          beschreibung={t('reset.beschreibung')}
          folgen={[t('reset.folge1'), t('reset.folge2'), t('reset.folge3')]}
          bestaetigenText={t('reset.bestaetigen')}
          laeuft={resetLaeuft}
          laeuftText={t('reset.laeuft')}
        />
      </div>
    </main>
  );
}
