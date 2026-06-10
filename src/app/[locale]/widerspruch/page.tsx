'use client';

import { ArrowLeft, Bell, Clock, Eye, FileText, Info, Mail, Save, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { toast } from 'sonner';

import { PaywallModal } from '@/src/components/modal/PaywallModal';
import { PdfPreviewModal } from '@/src/components/modal/PdfPreviewModal';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Textarea } from '@/src/components/ui/textarea';
import { usePdfDownload } from '@/src/hooks/usePdfDownload';
import { useStripeCheckout } from '@/src/hooks/useStripeCheckout';
import {
  WiderspruchDaten,
  WiderspruchFrist,
  WiderspruchTyp,
  berechneFrist,
  generiereWiderspruchBrief,
  formatiereFristInfo,
} from '@/src/lib/widerspruch/utils';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const MVP_PRODUCTS = [
  { id: 'beta_special', name: 'Beta-Special (12 Monate)', price_cents: 2900 },
  { id: 'standard_monthly', name: 'Standard Monatlich', price_cents: 3900 },
];

export default function WiderspruchPage(props: PageProps) {
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

  // 🚀 DATUMS-VALIDIERUNG: Ermittelt das heutige Datum für den max-Wert (Zukunftsschutz)
  const heuteISO = new Date().toISOString().split('T')[0];

  // Prüft, ob das Datum logisch valide ist (nicht leer, existiert und ist <= heute)
  const isDatumGueltig =
    bescheidDatum !== '' && !isNaN(new Date(bescheidDatum).getTime()) && bescheidDatum <= heuteISO;

  // Zeigt den Fehler nur an, wenn der Nutzer etwas eingetippt hat, das aber ungültig ist
  const zeigeDatumFehler = bescheidDatum !== '' && !isDatumGueltig;

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

  const handleKalkulation = async () => {
    if (!isFormValid) {
      toast.error('Bitte füllen Sie alle markierten Pflichtfelder korrekt aus.');
      return;
    }

    setIsVerifying(true);
    const verificationToast = toast.loading('Verifiziere aktive Lizenzrechte...');

    try {
      const checkRes = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          caseCode: (caseCode || 'OFFLINE_WD').toUpperCase(),
          html: '<li>Lizenzprüfung</li>',
          title: 'CHECK',
        }),
      });

      if (checkRes.status === 402) {
        toast.dismiss(verificationToast);
        setShowPaywall(true);
        setShowErgebnis(false);
        return;
      }

      toast.dismiss(verificationToast);

      // Freigabe: Daten berechnen und rendern
      const zielFrist = berechneFrist(new Date(bescheidDatum), typ);
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
      toast.success('Anschreiben wurde erfolgreich generiert.');
    } catch {
      toast.error('Die Lizenzprüfung ist fehlgeschlagen. Bitte prüfen Sie Ihre Verbindung.', {
        id: verificationToast,
      });
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
    toast.success('Entwurf erfolgreich gesichert.');
  };

  const handleLoeschen = (id: string | undefined) => {
    if (!id) return;
    const gefiltert = gespeicherte.filter((w) => w.id !== id);
    setGespeicherte(gefiltert);
    localStorage.setItem('widersprueche_pipeline', JSON.stringify(gefiltert));
    toast.info('Akte entfernt.');
  };

  if (!hasMounted) return null;

  return (
    <main className="min-h-screen bg-slate-900 py-12 px-4 text-white font-sans">
      <div className="container mx-auto max-w-3xl space-y-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-2xl shadow-xl mb-4">
            <FileText className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Widerspruchs-Zentrum</h1>
          <p className="text-sm text-gray-400 mt-1">
            Gekoppelt an aktive Fallnummer:{' '}
            <span className="text-white font-mono font-bold">
              {caseCode || 'Keine (Kaltstart)'}
            </span>
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 rounded-xl p-1 mb-6 text-white">
            <TabsTrigger
              value="neu"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-bold rounded-lg py-2 text-sm transition-all"
            >
              Neues Anschreiben
            </TabsTrigger>
            <TabsTrigger
              value="gespeichert"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-bold rounded-lg py-2 text-sm transition-all"
            >
              Gespeicherte Entwürfe ({gespeicherte.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="neu" className="space-y-6">
            <Card className="bg-white/5 border-white/10 text-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Mail className="w-5 h-5 text-amber-400" /> DIN 5008 Stammdaten erfassen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-300 font-medium">Verfahrenstyp</Label>
                  <Select
                    value={typ}
                    onValueChange={(v: string) => {
                      const neuerTyp = v as WiderspruchTyp;
                      setTyp(neuerTyp);
                      if (bescheidDatum && isDatumGueltig) {
                        const zielFrist = berechneFrist(new Date(bescheidDatum), neuerTyp);
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
                      <SelectItem value="pflegegrad">Pflegegrad-Bescheid (§ 78 SGB X)</SelectItem>
                      <SelectItem value="mdk-gutachten">
                        MDK-Gutachten Anforderung (§ 78 SGB X)
                      </SelectItem>
                      <SelectItem value="klage">Klage beim Sozialgericht (§ 84 SGG)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 🚀 ÜBERARBEITETES DATUMS-FELD MIT FEHLER-HIGHLIGHTING */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="bescheidDatum"
                    className={`text-xs font-medium transition-colors ${zeigeDatumFehler ? 'text-rose-400' : 'text-gray-300'}`}
                  >
                    Datum des Bescheid-Zugangs *
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
                    <p className="text-[10px] text-rose-400 font-medium">
                      Ungültiges Datum oder Datum liegt in der Zukunft.
                    </p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs text-gray-300 font-medium">
                      Name des Versicherten *
                    </Label>
                    <Input
                      id="name"
                      value={versicherterName}
                      onChange={(e) => setVersicherterName(e.target.value)}
                      placeholder="z.B. Max Mustermann"
                      className="bg-slate-950/50 border-white/10 h-11 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pflegekasse" className="text-xs text-gray-300 font-medium">
                      Pflegekasse *
                    </Label>
                    <Input
                      id="pflegekasse"
                      value={pflegekasse}
                      onChange={(e) => setPflegekasse(e.target.value)}
                      placeholder="z.B. BARMER Pflegekasse"
                      className="bg-slate-950/50 border-white/10 h-11 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="strasse" className="text-xs text-gray-300 font-medium">
                    Straße und Hausnummer *
                  </Label>
                  <Input
                    id="strasse"
                    value={strasse}
                    onChange={(e) => setStrasse(e.target.value)}
                    placeholder="Musterstraße 12"
                    className="bg-slate-950/50 border-white/10 h-11 text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5 col-span-1">
                    <Label htmlFor="plz" className="text-xs text-gray-300 font-medium">
                      PLZ *
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
                      Ort *
                    </Label>
                    <Input
                      id="ort"
                      value={ort}
                      onChange={(e) => setOrt(e.target.value)}
                      placeholder="Musterstadt"
                      className="bg-slate-950/50 border-white/10 h-11 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="versicherungsnummer"
                    className="text-xs text-gray-300 font-medium"
                  >
                    Versicherungsnummer
                  </Label>
                  <Input
                    id="versicherungsnummer"
                    value={versicherungsnummer}
                    onChange={(e) => setVersicherungsnummer(e.target.value)}
                    placeholder="z.B. KV-Nummer eintragen"
                    className="bg-slate-950/50 border-white/10 h-11 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="begruendung" className="text-xs text-gray-300 font-medium">
                    Begründung (Leer lassen für fristwahrenden Vorab-Widerspruch)
                  </Label>
                  <Textarea
                    id="begruendung"
                    value={begruendung}
                    onChange={(e) => setBegruendung(e.target.value)}
                    placeholder="Wird zur Fristwahrung unbegründet eingereicht..."
                    rows={3}
                    className="bg-slate-950/50 border-white/10 text-white resize-none"
                  />
                </div>

                <Button
                  onClick={handleKalkulation}
                  disabled={!isFormValid || isVerifying}
                  className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base shadow-lg rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Clock className="mr-2 w-4 h-4" />
                  {isVerifying ? 'Überprüfe...' : 'Brief entwerfen & Frist ermitteln'}
                </Button>
              </CardContent>
            </Card>

            {showErgebnis && frist && (
              <>
                <Card
                  className={`bg-white/5 border-l-4 text-white shadow-md ${
                    frist.ampelStatus === 'gruen'
                      ? 'border-l-emerald-500'
                      : frist.ampelStatus === 'gelb'
                        ? 'border-l-amber-500'
                        : 'border-l-rose-500'
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-400" /> Fristen-Monitor Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <p className="font-mono bg-slate-950/40 p-3 rounded-xl border border-white/5 text-gray-200">
                      {formatiereFristInfo(frist)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 text-white shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-base font-bold">Vorschau des Anschreibens</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      id="widerspruch-preview-zone"
                      className="bg-slate-950/60 border border-white/10 rounded-xl p-4 font-mono text-xs text-gray-200 geometry-letter leading-relaxed whitespace-pre-wrap"
                    >
                      {briefText}
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col sm:flex-row gap-3 pt-0">
                    <Button
                      onClick={() => setIsPreviewOpen(true)}
                      className="flex-1 h-12 bg-[#20b2aa] hover:bg-[#3ddbd0] text-white font-bold rounded-xl shadow-md"
                    >
                      <Eye className="mr-2 w-4 h-4" /> Gutachten-Vorschau öffnen
                    </Button>
                    <Button
                      onClick={handleSpeichern}
                      variant="outline"
                      className="flex-1 h-12 border-white/10 text-white hover:bg-white/5 rounded-xl"
                    >
                      <Save className="mr-2 w-4 h-4" /> Entwurf sichern
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
                  <p className="text-gray-400 text-sm">Keine Einträge gesichert.</p>
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
            onCheckout={(paketId) => triggerCheckout(caseCode, paketId)}
            onClose={() => setShowPaywall(false)}
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
            <ArrowLeft className="mr-2 w-4 h-4" /> Zurück zum Hauptportal
          </Button>
        </div>
      </div>
    </main>
  );
}
