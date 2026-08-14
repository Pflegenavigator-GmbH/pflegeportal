// src/app/[locale]/em-rente/page.tsx
'use client';

import {
  Briefcase,
  Calculator,
  ArrowRight,
  ArrowLeft,
  Euro,
  Info,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  Heart,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { useState, use } from 'react';

import { RechtshinweisFuss } from '@/src/components/layout/SeitenFuss';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Label,
} from '@/src/components/ui';
import {
  RECHENGROESSEN,
  berechneEmRente,
  hatBerufsschutz,
  type EmRenteErgebnis,
  type Erwerbsminderungsart,
} from '@/src/lib/em-rente/berechnung';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const LEER = {
  geburtsdatum: '',
  eintrittsdatum: '',
  art: '' as Erwerbsminderungsart | '',
  beitragsjahre: '',
  bruttoJahresentgelt: '',
};

/**
 * Zeile der Ergebnis-Aufschlüsselung — der Betrag steht rechts, monospaced.
 *
 * Auf Modulebene, nicht in der Seite: Eine im Rendern erzeugte Komponente hat
 * bei jedem Durchlauf eine neue Identität, React wirft den Teilbaum deshalb
 * weg und baut ihn neu auf, statt ihn zu aktualisieren.
 */
function Zeile({ bezeichnung, wert }: { bezeichnung: string; wert: string }) {
  return (
    <div className="flex justify-between items-baseline gap-4 py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-gray-400">{bezeichnung}</span>
      <span className="text-sm font-mono font-semibold text-white whitespace-nowrap">{wert}</span>
    </div>
  );
}

export default function EmRenteRechner(props: PageProps) {
  const router = useRouter();
  const params = use(props.params);
  const locale = params?.locale || 'de';
  const t = useTranslations('em-rente');
  const format = useFormatter();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(LEER);
  const [ergebnis, setErgebnis] = useState<EmRenteErgebnis | null>(null);

  const euro = (betrag: number) => format.number(betrag, { style: 'currency', currency: 'EUR' });
  const punkte = (wert: number) =>
    format.number(wert, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const kalkuliere = () => {
    if (!formData.art) return;
    setErgebnis(
      berechneEmRente({
        geburtsdatum: formData.geburtsdatum,
        eintrittsdatum: formData.eintrittsdatum,
        art: formData.art,
        beitragsjahre: Number(formData.beitragsjahre) || 0,
        bruttoJahresentgeltEuro: Number(formData.bruttoJahresentgelt) || 0,
      })
    );
    setStep(4);
  };

  // § 240 SGB VI hängt allein am Geburtsdatum aus Schritt 1 — die Auswahl in
  // Schritt 2 richtet sich danach.
  const berufsschutz = formData.geburtsdatum ? hatBerufsschutz(formData.geburtsdatum) : false;

  const schritt1Gueltig = Boolean(formData.geburtsdatum && formData.eintrittsdatum);
  const schritt2Gueltig = formData.art !== '';
  const schritt3Gueltig = Boolean(formData.beitragsjahre && formData.bruttoJahresentgelt);

  return (
    <main className="min-h-screen bg-slate-900 text-white font-sans py-12 px-4">
      <div className="container mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 mb-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#0f2744] to-[#20b2aa] border border-white/10 rounded-2xl shadow-xl">
            <Briefcase className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{t('titel')}</h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
            {t('untertitel')}
          </p>
        </div>

        {/* Richtigstellung zum Pflegegrad — ersetzt die frühere Behauptung, ab
            Pflegegrad 3 gebe es eine Zulage zur Rente. */}
        {step < 4 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-gray-300 text-xs sm:text-sm leading-relaxed">
              <strong>{t('hinweisTitel')}:</strong> {t('hinweis')}
            </div>
          </div>
        )}

        {/* Schritt 1: Grunddaten */}
        {step === 1 && (
          <Card className="bg-white/5 border-white/10 shadow-xl">
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <CardTitle className="text-lg text-white">{t('schritt1.titel')}</CardTitle>
                  <CardDescription className="text-gray-400 text-xs mt-1">
                    {t('schritt1.untertitel')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="geburtsdatum" className="text-xs text-gray-300">
                    {t('schritt1.geburtsdatum')}
                  </Label>
                  <Input
                    id="geburtsdatum"
                    type="date"
                    className="bg-slate-950/50 border-white/10 h-11 text-white"
                    value={formData.geburtsdatum}
                    onChange={(e) => setFormData({ ...formData, geburtsdatum: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eintrittsdatum" className="text-xs text-gray-300">
                    {t('schritt1.eintritt')}
                  </Label>
                  <Input
                    id="eintrittsdatum"
                    type="date"
                    className="bg-slate-950/50 border-white/10 h-11 text-white"
                    value={formData.eintrittsdatum}
                    onChange={(e) => setFormData({ ...formData, eintrittsdatum: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {t('schritt1.eintrittHinweis')}
              </p>
              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!schritt1Gueltig}
                  className="h-11 bg-[#20b2aa] hover:bg-[#3ddbd0] text-slate-950 font-bold px-8 rounded-xl disabled:opacity-50"
                >
                  {t('weiter')} <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schritt 2: Art der Erwerbsminderung — der Rentenartfaktor ist der
            einzige Faktor, den die frühere Fassung gar nicht kannte. */}
        {step === 2 && (
          <Card className="bg-white/5 border-white/10 shadow-xl">
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#20b2aa]/20 text-[#20b2aa] border border-[#20b2aa]/30 rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <CardTitle className="text-lg text-white">{t('schritt2.titel')}</CardTitle>
                  <CardDescription className="text-gray-400 text-xs mt-1">
                    {t('schritt2.untertitel')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="art" className="text-xs text-gray-300">
                  {t('schritt2.label')}
                </Label>
                <select
                  id="art"
                  className="w-full bg-slate-950/50 border border-white/10 h-11 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-[#20b2aa]"
                  value={formData.art}
                  onChange={(e) =>
                    setFormData({ ...formData, art: e.target.value as Erwerbsminderungsart | '' })
                  }
                >
                  <option value="">{t('schritt2.platzhalter')}</option>
                  <option value="voll">{t('schritt2.voll')}</option>
                  <option value="teilweise">{t('schritt2.teilweise')}</option>
                  {berufsschutz && (
                    <option value="berufsunfaehig">{t('schritt2.berufsunfaehig')}</option>
                  )}
                </select>
              </div>

              <div
                className={`p-4 rounded-xl flex items-start gap-3 border ${berufsschutz ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-950/40 border-white/10'}`}
              >
                <Info
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 ${berufsschutz ? 'text-emerald-400' : 'text-gray-400'}`}
                />
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  <strong className="text-white">
                    {berufsschutz
                      ? t('schritt2.berufsschutzTitel')
                      : t('schritt2.berufsschutzEntfallenTitel')}
                    :
                  </strong>{' '}
                  {berufsschutz
                    ? t('schritt2.berufsschutzText')
                    : t('schritt2.berufsschutzEntfallenText')}
                </p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-amber-200/80 leading-relaxed">
                  {t('schritt2.hinweis')}
                </p>
              </div>

              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="h-11 border-white/10 text-white hover:bg-white/5 px-6 rounded-xl"
                >
                  <ArrowLeft className="mr-2 w-4 h-4" /> {t('zurueck')}
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!schritt2Gueltig}
                  className="h-11 bg-[#20b2aa] hover:bg-[#3ddbd0] text-slate-950 font-bold px-8 rounded-xl disabled:opacity-50"
                >
                  {t('weiter')} <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schritt 3: Versicherungsverlauf */}
        {step === 3 && (
          <Card className="bg-white/5 border-white/10 shadow-xl">
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <CardTitle className="text-lg text-white">{t('schritt3.titel')}</CardTitle>
                  <CardDescription className="text-gray-400 text-xs mt-1">
                    {t('schritt3.untertitel')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="beitragsjahre" className="text-xs text-gray-300">
                    {t('schritt3.beitragsjahre')}
                  </Label>
                  <Input
                    id="beitragsjahre"
                    type="number"
                    min="0"
                    placeholder={t('schritt3.beitragsjahrePlatzhalter')}
                    className="bg-slate-950/50 border-white/10 h-11 text-white"
                    value={formData.beitragsjahre}
                    onChange={(e) => setFormData({ ...formData, beitragsjahre: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bruttoJahresentgelt" className="text-xs text-gray-300">
                    {t('schritt3.gehalt')}
                  </Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id="bruttoJahresentgelt"
                      type="number"
                      min="0"
                      className="pl-10 bg-slate-950/50 border-white/10 h-11 text-white"
                      placeholder={t('schritt3.gehaltPlatzhalter')}
                      value={formData.bruttoJahresentgelt}
                      onChange={(e) =>
                        setFormData({ ...formData, bruttoJahresentgelt: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/40 p-4 border border-white/5 rounded-xl text-xs text-gray-400 leading-relaxed">
                {t('schritt3.hinweis')}
              </div>

              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="h-11 border-white/10 text-white hover:bg-white/5 px-6 rounded-xl"
                >
                  <ArrowLeft className="mr-2 w-4 h-4" /> {t('zurueck')}
                </Button>
                <Button
                  onClick={kalkuliere}
                  disabled={!schritt3Gueltig}
                  className="h-11 bg-[#20b2aa] hover:bg-[#3ddbd0] text-slate-950 font-bold px-8 rounded-xl disabled:opacity-50"
                >
                  <Calculator className="mr-2 w-4 h-4" /> {t('kalkulieren')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schritt 4: Ergebnis */}
        {step === 4 && ergebnis && (
          <div className="space-y-6">
            <Card className="bg-white/5 border-[#20b2aa]/30 shadow-2xl overflow-hidden">
              <div className="p-6 sm:p-8 bg-gradient-to-br from-[#20b2aa]/10 to-transparent space-y-6">
                <div className="flex items-center gap-3">
                  <Calculator className="w-6 h-6 text-[#20b2aa]" />
                  <CardTitle className="text-xl text-white">{t('ergebnis.titel')}</CardTitle>
                </div>

                {ergebnis.berufsschutzEntfallen && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      <strong className="block text-white">
                        {t('ergebnis.keinAnspruchTitel')}
                      </strong>
                      {t('ergebnis.keinAnspruchText')}
                    </span>
                  </div>
                )}

                {ergebnis.wartezeitErfuellt ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{t('ergebnis.wartezeitOk')}</span>
                  </div>
                ) : (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{t('ergebnis.wartezeitFehlt')}</span>
                  </div>
                )}

                {/* Der Betrag — eine Zahl statt der früheren drei, von denen
                    zwei auf einer nicht existierenden Zulage beruhten. */}
                <div className="bg-[#20b2aa]/20 border border-[#20b2aa]/30 rounded-xl p-6 text-center">
                  <p className="text-xs text-[#20b2aa] mb-2 font-bold uppercase tracking-wide">
                    {t('ergebnis.monatsrente')}
                  </p>
                  <p className="text-4xl font-extrabold text-white">
                    {euro(ergebnis.monatsrenteEuro)}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-gray-400 text-xs mt-3">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>{t('ergebnis.auszahlung')}</span>
                  </div>
                </div>

                {/* Aufschlüsselung: Wer eine Zahl bekommt, soll nachvollziehen
                    können, woher sie stammt — sonst bleibt jede Korrektur
                    unüberprüfbar. */}
                <div className="bg-slate-950/40 border border-white/5 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-white mb-3">
                    {t('ergebnis.aufschluesselung')}
                  </h3>
                  <Zeile
                    bezeichnung={t('ergebnis.epBeitrag')}
                    wert={punkte(ergebnis.entgeltpunkteBeitrag)}
                  />
                  <Zeile
                    bezeichnung={t('ergebnis.epZurechnung')}
                    wert={punkte(ergebnis.entgeltpunkteZurechnung)}
                  />
                  <Zeile
                    bezeichnung={t('ergebnis.zurechnungszeit')}
                    wert={t('ergebnis.monate', { monate: ergebnis.zurechnungsmonate })}
                  />
                  <Zeile
                    bezeichnung={t('ergebnis.epGesamt')}
                    wert={punkte(ergebnis.entgeltpunkteGesamt)}
                  />
                  <Zeile
                    bezeichnung={t('ergebnis.abschlag')}
                    wert={t('ergebnis.abschlagWert', {
                      prozent: format.number(ergebnis.abschlagProzent, {
                        maximumFractionDigits: 1,
                      }),
                      monate: ergebnis.abschlagsmonate,
                    })}
                  />
                  <Zeile
                    bezeichnung={t('ergebnis.hinzuverdienst')}
                    wert={euro(ergebnis.hinzuverdienstgrenzeJahrEuro)}
                  />
                  <Zeile
                    bezeichnung={t('ergebnis.laeuftBis')}
                    wert={format.dateTime(new Date(ergebnis.renteLaeuftBis), 'kurz')}
                  />
                  <Zeile
                    bezeichnung={t('ergebnis.rentenwert')}
                    wert={euro(RECHENGROESSEN.rentenwertEuro)}
                  />
                  <p className="text-[10px] text-gray-500 mt-3">
                    {t('ergebnis.stand', { stand: RECHENGROESSEN.stand })}
                  </p>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed">
                  {t('ergebnis.hinzuverdienstHinweis')}
                </p>

                <p className="text-xs text-gray-400 leading-relaxed">
                  {t('ergebnis.laeuftBisHinweis', {
                    jahre: Math.floor(ergebnis.regelaltersgrenzeMonate / 12),
                    monate: ergebnis.regelaltersgrenzeMonate % 12,
                  })}
                </p>

                <p className="text-xs text-gray-400 leading-relaxed">
                  {t('ergebnis.voraussetzungen')}
                </p>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card
                className="bg-white/5 border-white/10 text-white hover:bg-white/[0.07] transition-colors cursor-pointer group"
                onClick={() => router.push(`/${locale}/briefe?kategorie=em-rente`)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{t('aktionen.antragTitel')}</CardTitle>
                      <CardDescription className="text-gray-400 text-xs mt-1">
                        {t('aktionen.antragText')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-[#20b2aa] hover:bg-[#3ddbd0] text-slate-950 font-bold rounded-xl h-10 text-xs">
                    {t('aktionen.antragKnopf')} <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 text-white">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                      <Heart className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{t('aktionen.beratungTitel')}</CardTitle>
                      <CardDescription className="text-gray-400 text-xs mt-1">
                        {t('aktionen.beratungText')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full border-white/10 text-white hover:bg-white/5 rounded-xl h-10 text-xs"
                    onClick={() =>
                      window.open(
                        'https://www.deutsche-rentenversicherung.de',
                        '_blank',
                        'noopener,noreferrer'
                      )
                    }
                  >
                    {t('aktionen.beratungKnopf')} <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center pt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setStep(1);
                  setErgebnis(null);
                  setFormData(LEER);
                }}
                className="text-gray-400 hover:text-white hover:bg-white/5 px-6 rounded-xl"
              >
                <ArrowLeft className="mr-2 w-4 h-4" /> {t('neueProjektion')}
              </Button>
            </div>
          </div>
        )}

        <RechtshinweisFuss>{t('disclaimer')}</RechtshinweisFuss>
      </div>
    </main>
  );
}
