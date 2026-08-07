'use client';

import { ArrowLeft, Bell, Clock, FileText, Info, Lock, Mail, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState, use } from 'react';
import { toast } from 'sonner';

import { FristenMonitor } from '@/src/components/fristen';
import { PaywallModal } from '@/src/components/modal/PaywallModal';
import { PdfPreviewModal } from '@/src/components/modal/PdfPreviewModal';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@/src/components/ui';
import { useBescheidDatum } from '@/src/hooks/useBescheidDatum';
import { usePdfDownload } from '@/src/hooks/usePdfDownload';
import { useStripeCheckout } from '@/src/hooks/useStripeCheckout';
import { ladeFreischaltung, verwerfeFreischaltung } from '@/src/lib/billing/entitlement';
import { heuteAlsIso } from '@/src/lib/widerspruch/bescheid-datum';
import { berechneFristen } from '@/src/lib/widerspruch/fristen';
import {
  WiderspruchDaten,
  WiderspruchFrist,
  WiderspruchTyp,
  berechneFrist,
  generiereWiderspruchBrief,
} from '@/src/lib/widerspruch/utils';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const MVP_PRODUCTS = [
  { id: 'beta_special', name: 'Beta-Special (12 Monate)', price_cents: 2900 },
  { id: 'standard_monthly', name: 'Standard Monatlich', price_cents: 3900 },
];

export default function WiderspruchPage(props: PageProps) {
  const t = useTranslations('widerspruch');
  const router = useRouter();
  const params = use(props.params);
  const locale = params?.locale || 'de';

  const [hasMounted, setHasMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('neu');
  const [gespeicherte, setGespeicherte] = useState<WiderspruchDaten[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Formular-States
  const [typ, setTyp] = useState<WiderspruchTyp>('pflegegrad');
  const [bescheidDatum, setBescheidDatum] = useState('');
  const [versicherterName, setVersicherterName] = useState('');
  const [pflegekasse, setPflegekasse] = useState('');
  const [versicherungsnummer, setVersicherungsnummer] = useState('');
  const [strasse, setStrasse] = useState('');
  const [plz, setPlz] = useState('');
  const [ort, setOrt] = useState('');
  const [begruendung, setBegruendung] = useState('');

  // Verfahrensverlauf — je Datum kommt eine weitere Frist in den Monitor.
  // Jede Frist hat ihr eigenes auslösendes Ereignis (die Klagefrist läuft ab
  // dem Widerspruchsbescheid, nicht ab dem Ausgangsbescheid).
  const [antragDatum, setAntragDatum] = useState('');
  const [widerspruchEingelegtAm, setWiderspruchEingelegtAm] = useState('');
  const [widerspruchsbescheidDatum, setWiderspruchsbescheidDatum] = useState('');

  // Ergebnis-States
  const [frist, setFrist] = useState<WiderspruchFrist | null>(null);
  const [briefText, setBriefText] = useState('');
  const [showErgebnis, setShowErgebnis] = useState(false);

  const [caseCode] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('case_code');
    }
    return null;
  });

  const { bescheidDatum: gespeichertesBescheidDatum } = useBescheidDatum(caseCode);

  // Auf der Ergebnisseite erfasstes Datum übernehmen, damit es nicht zweimal
  // eingegeben werden muss. Anpassung während des Renderns statt im Effekt
  // (React: „You Might Not Need an Effect") — das spart einen sichtbaren
  // Zwischenzustand mit leerem Feld. Greift genau einmal; danach hat der
  // Nutzer die Hoheit über das Feld.
  const [datumUebernommen, setDatumUebernommen] = useState(false);
  if (!datumUebernommen && gespeichertesBescheidDatum && bescheidDatum === '') {
    setDatumUebernommen(true);
    setBescheidDatum(gespeichertesBescheidDatum);
  }

  // 🚀 DATUMS-VALIDIERUNG: Ermittelt das heutige Datum für den max-Wert (Zukunftsschutz)
  const heuteISO = heuteAlsIso();

  // Prüft, ob das Datum logisch valide ist (nicht leer, existiert und ist <= heute)
  const isDatumGueltig =
    bescheidDatum !== '' && !isNaN(new Date(bescheidDatum).getTime()) && bescheidDatum <= heuteISO;

  // Zeigt den Fehler nur an, wenn der Nutzer etwas eingetippt hat, das aber ungültig ist
  const zeigeDatumFehler = bescheidDatum !== '' && !isDatumGueltig;

  // Fristen-Monitor rechnet live mit: Sobald ein Datum erfasst ist, sieht der
  // Nutzer den Status — Fristversäumnis ist irreversibel und darf nicht erst
  // nach dem Erzeugen des Anschreibens sichtbar werden.
  const fristenUebersicht = useMemo(
    () =>
      berechneFristen({
        bescheidDatum: isDatumGueltig ? bescheidDatum : null,
        antragDatum,
        widerspruchEingelegtAm,
        widerspruchsbescheidDatum,
      }),
    [bescheidDatum, isDatumGueltig, antragDatum, widerspruchEingelegtAm, widerspruchsbescheidDatum]
  );

  // 🚀 SAUBERE VALIDIERUNG: Prüft, ob alle Strings wirklich Text enthalten UND das Datum stimmt
  const isFormValid = Boolean(
    isDatumGueltig &&
    versicherterName.trim() &&
    pflegekasse.trim() &&
    strasse.trim() &&
    plz.trim() &&
    ort.trim()
  );

  // 1. Hook: PDF-Download-Infrastruktur
  const { downloadPdf, loadingPdf, showPaywall, setShowPaywall } = usePdfDownload({
    caseCode: caseCode || 'OFFLINE_WD',
    elementId: 'widerspruch-preview-zone',
    documentTitle: `Widerspruchsschreiben_${versicherterName.replace(/\s+/g, '_')}`,
    footerText: 'PflegeNavigator EU gUG — Offizielles Schreiben nach § 78 SGB X',
    fallbackHtml: briefText ? `<div>${briefText}</div>` : undefined,
  });

  // 2. Hook: Ausgelagerte Stripe-Verbindung
  const { triggerCheckout, checkoutLoading } = useStripeCheckout();

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasMounted(true);
      const gespeichertLocal = localStorage.getItem('widersprueche_pipeline');
      if (gespeichertLocal) {
        try {
          setGespeicherte(JSON.parse(gespeichertLocal));
        } catch {
          setGespeicherte([]);
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Brieftext und Fristen sind bewusst frei zugänglich: Musterschreiben für
   * einen Widerspruch sind allgemein verfügbar, und eine versäumte Frist ist
   * nicht heilbar. Kostenpflichtig sind die weiterführenden Funktionen
   * (Entwurf sichern, Gutachten-Vorschau, PDF-Download).
   */
  const handleKalkulation = () => {
    if (!isFormValid) {
      toast.error(t('pflichtfelder'));
      return;
    }

    const zielFrist = berechneFrist(bescheidDatum, typ);
    setFrist(zielFrist);

    const daten: WiderspruchDaten = {
      caseCode,
      typ,
      bescheidDatum,
      versicherterName,
      pflegekasse,
      versicherungsnummer,
      strasse,
      plz,
      ort,
      begruendung,
    };

    setBriefText(generiereWiderspruchBrief(daten, zielFrist));
    setShowErgebnis(true);
    toast.success(t('briefErzeugt'));
  };

  /**
   * Führt eine kostenpflichtige Aktion nur bei freigeschaltetem Fall aus.
   *
   * Die Prüfung ist reine Anzeigelogik — die eigentliche Durchsetzung liegt
   * serverseitig in den API-Routen. Ein Netzfehler führt deshalb weder zur
   * Freigabe noch zur Paywall, sondern zu einer ehrlichen Fehlermeldung.
   */
  const mitFreischaltung = async (aktion: () => void) => {
    setIsVerifying(true);
    try {
      const freischaltung = await ladeFreischaltung(caseCode);

      if (freischaltung.status === 'freigeschaltet') {
        aktion();
        return;
      }

      if (freischaltung.status === 'gesperrt') {
        setShowPaywall(true);
        return;
      }

      toast.error(t('lizenzFehler'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSpeichern = () => {
    const daten: WiderspruchDaten = {
      id: Math.random().toString(36).substring(2, 9),
      caseCode,
      typ,
      bescheidDatum,
      versicherterName,
      pflegekasse,
      versicherungsnummer,
      strasse,
      plz,
      ort,
      begruendung,
    };
    const aktualisiert = [...gespeicherte, daten];
    setGespeicherte(aktualisiert);
    localStorage.setItem('widersprueche_pipeline', JSON.stringify(aktualisiert));
    toast.success(t('entwurfGesichert'));
  };

  const handleLoeschen = (id: string | undefined) => {
    if (!id) return;
    const gefiltert = gespeicherte.filter((w) => w.id !== id);
    setGespeicherte(gefiltert);
    localStorage.setItem('widersprueche_pipeline', JSON.stringify(gefiltert));
    toast.info(t('akteEntfernt'));
  };

  if (!hasMounted) return null;

  return (
    <main className="min-h-screen bg-slate-900 py-12 px-4 text-white font-sans">
      <div className="container mx-auto max-w-3xl space-y-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-2xl shadow-xl mb-4">
            <FileText className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t('titel')}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {t('fallBindung')}{' '}
            <span className="text-white font-mono font-bold">{caseCode || t('keinFall')}</span>
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 rounded-xl p-1 mb-6 text-white">
            <TabsTrigger
              value="neu"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-bold rounded-lg py-2 text-sm transition-all"
            >
              {t('tabNeu')}
            </TabsTrigger>
            <TabsTrigger
              value="gespeichert"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-bold rounded-lg py-2 text-sm transition-all"
            >
              {t('tabGespeichert', { anzahl: gespeicherte.length })}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="neu" className="space-y-6">
            <Card className="bg-white/5 border-white/10 text-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Mail className="w-5 h-5 text-amber-400" /> {t('stammdatenTitel')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-300 font-medium">{t('verfahrenstyp')}</Label>
                  <Select
                    value={typ}
                    onValueChange={(v: string) => {
                      const neuerTyp = v as WiderspruchTyp;
                      setTyp(neuerTyp);
                      if (bescheidDatum && isDatumGueltig) {
                        const zielFrist = berechneFrist(bescheidDatum, neuerTyp);
                        setFrist(zielFrist);
                        const daten: WiderspruchDaten = {
                          caseCode,
                          typ: neuerTyp,
                          bescheidDatum,
                          versicherterName,
                          pflegekasse,
                          versicherungsnummer,
                          strasse,
                          plz,
                          ort,
                          begruendung,
                        };
                        setBriefText(generiereWiderspruchBrief(daten, zielFrist));
                      }
                    }}
                  >
                    <SelectTrigger className="bg-slate-950/50 border-white/10 h-11 text-sm text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-white/10 text-white">
                      <SelectItem value="pflegegrad">{t('typ.pflegegrad')}</SelectItem>
                      <SelectItem value="mdk-gutachten">{t('typ.gutachten')}</SelectItem>
                      <SelectItem value="klage">{t('typ.klage')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 🚀 ÜBERARBEITETES DATUMS-FELD MIT FEHLER-HIGHLIGHTING */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="bescheidDatum"
                    className={`text-xs font-medium transition-colors ${zeigeDatumFehler ? 'text-rose-400' : 'text-gray-300'}`}
                  >
                    {t('bescheidDatum')}
                  </Label>
                  <Input
                    id="bescheidDatum"
                    type="date"
                    max={heuteISO} // Native Browser-Sperre für die Zukunft
                    value={bescheidDatum}
                    onChange={(e) => setBescheidDatum(e.target.value)}
                    className={`bg-slate-950/50 h-11 text-white transition-all ${
                      zeigeDatumFehler
                        ? 'border-rose-500 focus-visible:ring-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                        : 'border-white/10'
                    }`}
                  />
                  {zeigeDatumFehler && (
                    <p className="text-[10px] text-rose-400 font-medium">{t('datumUngueltig')}</p>
                  )}
                </div>

                {/* Verfahrensverlauf: jedes Datum schaltet eine weitere Frist
                    im Monitor frei. Optional, weil die Fristen unterschiedliche
                    auslösende Ereignisse haben. */}
                <fieldset className="space-y-3 rounded-xl border border-white/10 bg-slate-950/30 p-4">
                  <legend className="px-1 text-xs font-semibold text-gray-300">
                    {t('verlaufTitel')}
                  </legend>
                  <p className="text-[11px] leading-relaxed text-gray-400">{t('verlaufText')}</p>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="antragDatum" className="text-xs text-gray-300 font-medium">
                        {t('antragGestellt')}
                      </Label>
                      <Input
                        id="antragDatum"
                        type="date"
                        max={heuteISO}
                        value={antragDatum}
                        onChange={(e) => setAntragDatum(e.target.value)}
                        className="bg-slate-950/50 border-white/10 h-11 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="widerspruchEingelegtAm"
                        className="text-xs text-gray-300 font-medium"
                      >
                        {t('widerspruchEingelegt')}
                      </Label>
                      <Input
                        id="widerspruchEingelegtAm"
                        type="date"
                        max={heuteISO}
                        value={widerspruchEingelegtAm}
                        onChange={(e) => setWiderspruchEingelegtAm(e.target.value)}
                        className="bg-slate-950/50 border-white/10 h-11 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="widerspruchsbescheidDatum"
                        className="text-xs text-gray-300 font-medium"
                      >
                        {t('widerspruchsbescheid')}
                      </Label>
                      <Input
                        id="widerspruchsbescheidDatum"
                        type="date"
                        max={heuteISO}
                        value={widerspruchsbescheidDatum}
                        onChange={(e) => setWiderspruchsbescheidDatum(e.target.value)}
                        className="bg-slate-950/50 border-white/10 h-11 text-white"
                      />
                    </div>
                  </div>
                </fieldset>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs text-gray-300 font-medium">
                      {t('name')}
                    </Label>
                    <Input
                      id="name"
                      value={versicherterName}
                      onChange={(e) => setVersicherterName(e.target.value)}
                      placeholder={t('namePlatzhalter')}
                      className="bg-slate-950/50 border-white/10 h-11 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pflegekasse" className="text-xs text-gray-300 font-medium">
                      {t('pflegekasse')}
                    </Label>
                    <Input
                      id="pflegekasse"
                      value={pflegekasse}
                      onChange={(e) => setPflegekasse(e.target.value)}
                      placeholder={t('pflegekassePlatzhalter')}
                      className="bg-slate-950/50 border-white/10 h-11 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="strasse" className="text-xs text-gray-300 font-medium">
                    {t('strasse')}
                  </Label>
                  <Input
                    id="strasse"
                    value={strasse}
                    onChange={(e) => setStrasse(e.target.value)}
                    placeholder={t('strassePlatzhalter')}
                    className="bg-slate-950/50 border-white/10 h-11 text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5 col-span-1">
                    <Label htmlFor="plz" className="text-xs text-gray-300 font-medium">
                      {t('plz')}
                    </Label>
                    <Input
                      id="plz"
                      value={plz}
                      onChange={(e) => setPlz(e.target.value)}
                      placeholder="12345"
                      maxLength={5}
                      className="bg-slate-950/50 border-white/10 h-11 text-white"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="ort" className="text-xs text-gray-300 font-medium">
                      {t('ort')}
                    </Label>
                    <Input
                      id="ort"
                      value={ort}
                      onChange={(e) => setOrt(e.target.value)}
                      placeholder={t('ortPlatzhalter')}
                      className="bg-slate-950/50 border-white/10 h-11 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="versicherungsnummer"
                    className="text-xs text-gray-300 font-medium"
                  >
                    {t('versicherungsnummer')}
                  </Label>
                  <Input
                    id="versicherungsnummer"
                    value={versicherungsnummer}
                    onChange={(e) => setVersicherungsnummer(e.target.value)}
                    placeholder={t('versicherungsnummerPlatzhalter')}
                    className="bg-slate-950/50 border-white/10 h-11 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="begruendung" className="text-xs text-gray-300 font-medium">
                    {t('begruendung')}
                  </Label>
                  <Textarea
                    id="begruendung"
                    value={begruendung}
                    onChange={(e) => setBegruendung(e.target.value)}
                    placeholder={t('begruendungPlatzhalter')}
                    rows={3}
                    className="bg-slate-950/50 border-white/10 text-white resize-none"
                  />
                </div>

                <Button
                  onClick={handleKalkulation}
                  disabled={!isFormValid}
                  className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base shadow-lg rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Clock className="mr-2 w-4 h-4" />
                  {t('briefErzeugen')}
                </Button>
              </CardContent>
            </Card>

            {/* Fristen-Monitor: unabhängig vom Anschreiben sichtbar, sobald ein
                Datum erfasst ist. Eine versäumte Frist ist nicht heilbar. */}
            <Card className="bg-white/5 border-white/10 text-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-400" /> {t('monitorTitel')}
                </CardTitle>
                <CardDescription className="text-xs text-gray-400">
                  {t('monitorText')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FristenMonitor uebersicht={fristenUebersicht} />
              </CardContent>
            </Card>

            {showErgebnis && frist && (
              <>
                <Card className="bg-white/5 border-white/10 text-white shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-base font-bold">{t('vorschauTitel')}</CardTitle>
                    <CardDescription className="text-xs text-gray-400">
                      {t('vorschauText')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      id="widerspruch-preview-zone"
                      className="bg-slate-950/60 border border-white/10 rounded-xl p-4 font-mono text-xs text-gray-200 geometry-letter leading-relaxed whitespace-pre-wrap"
                    >
                      {briefText}
                    </div>
                  </CardContent>
                  {/* Kostenpflichtige Aktionen — das Schloss macht die Schranke vorab
                      sichtbar, statt den Nutzer erst nach dem Klick zu überraschen. */}
                  <CardFooter className="flex flex-col sm:flex-row gap-3 pt-0">
                    <Button
                      onClick={() => mitFreischaltung(() => setIsPreviewOpen(true))}
                      disabled={isVerifying}
                      className="flex-1 h-12 bg-[#20b2aa] hover:bg-[#3ddbd0] text-white font-bold rounded-xl shadow-md disabled:opacity-60"
                    >
                      <Lock className="mr-2 w-4 h-4" aria-hidden="true" />
                      {isVerifying ? t('pruefe') : t('gutachtenVorschau')}
                    </Button>
                    <Button
                      onClick={() => mitFreischaltung(handleSpeichern)}
                      disabled={isVerifying}
                      variant="outline"
                      className="flex-1 h-12 border-white/10 text-white hover:bg-white/5 rounded-xl disabled:opacity-60"
                    >
                      <Lock className="mr-2 w-4 h-4" aria-hidden="true" />
                      {isVerifying ? t('pruefe') : t('entwurfSichern')}
                    </Button>
                  </CardFooter>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="gespeichert" className="space-y-4">
            {gespeicherte.length === 0 ? (
              <Card className="bg-white/5 border-white/10 text-white text-center py-8">
                <CardContent>
                  <Info className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">{t('keineEintraege')}</p>
                </CardContent>
              </Card>
            ) : (
              gespeicherte.map((w) => (
                <Card key={w.id} className="bg-white/5 border-white/10 text-white">
                  <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-base font-bold">{w.versicherterName}</CardTitle>
                      <CardDescription className="text-xs text-gray-400">
                        {w.pflegekasse} • Akte: {w.caseCode || 'Lokal'}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLoeschen(w.id)}
                      className="hover:bg-rose-500/10 text-gray-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Paywall Modal */}
        {showPaywall && (
          <PaywallModal
            caseCode={caseCode || 'WIDERSPRUCH'}
            isExpired={false}
            products={MVP_PRODUCTS}
            onCheckout={(paketId) => {
              // Vor dem Wechsel zu Stripe verwerfen, damit ein zwischenzeitlich
              // bezahlter Fall nach der Rückkehr nicht am alten Cache hängt.
              verwerfeFreischaltung(caseCode);
              return triggerCheckout(caseCode, paketId);
            }}
            onClose={() => {
              // Der Kauf kann auch in einem anderen Tab erfolgt sein.
              verwerfeFreischaltung(caseCode);
              setShowPaywall(false);
            }}
            loading={checkoutLoading}
          />
        )}

        {/* PDF Preview Modal */}
        <PdfPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          onConfirmPrint={async () => {
            setIsPreviewOpen(false);
            await downloadPdf();
          }}
          briefText={briefText}
          versicherterName={versicherterName}
          caseCode={caseCode}
          loading={loadingPdf}
        />

        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            onClick={() => router.push(`/${locale}`)}
            className="text-gray-400 hover:text-white hover:bg-white/5 h-11 px-6 rounded-xl"
          >
            <ArrowLeft className="mr-2 w-4 h-4" /> {t('zurueck')}
          </Button>
        </div>
      </div>
    </main>
  );
}
