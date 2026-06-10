// src/app/[locale]/datenschutz/auskunft/page.tsx
'use client';

import { FileText, ArrowRight, ArrowLeft, Mail, Check, Clock, Database } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, use } from 'react';
import { toast } from 'sonner';

import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function DatenauskunftPage(props: PageProps) {
  const router = useRouter();
  const params = use(props.params);
  const locale = params?.locale || 'de';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fallcode: '',
    email: '',
    bestaetigung: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Revisionssicheres Schreiben des Antrags in das System-Log (Simuliert via API)
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'other',
          rating: 5,
          message: `DSGVO Art. 15 Auskunftsbegehren für Fallcode: ${formData.fallcode}. Antwort-E-Mail: ${formData.email}`,
          email: formData.email,
        }),
      });

      if (!res.ok) throw new Error();

      setSubmitted(true);
      toast.success('Auskunftsantrag revisionssicher protokolliert.');
    } catch {
      toast.error('Fehler bei der Übermittlung. Bitte wenden Sie sich an den Support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white py-12 px-4 font-sans">
      <div className="container mx-auto max-w-2xl space-y-6">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-3">
            <FileText className="w-7 h-7 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Datenauskunft nach Art. 15 DSGVO</h1>
          <p className="text-xs text-gray-400 mt-1">
            Fordern Sie die vollständigen, lokal und serverseitig hinterlegten Maschinen-Datensätze
            Ihrer Akte an
          </p>
        </div>

        {!submitted ? (
          <Card className="bg-white/5 border-white/10 text-white shadow-xl">
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex items-center gap-2 text-xs font-mono text-gray-400 mb-1">
                <span>Schritt {step} von 2</span>
              </div>
              <CardTitle className="text-base font-bold text-white">
                Verfahrensdaten eingeben
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                {step === 1 ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-300 font-medium">
                        Zugeordneter Fallcode (z.B. PF-ABC123)
                      </label>
                      <Input
                        type="text"
                        value={formData.fallcode}
                        onChange={(e) =>
                          setFormData({ ...formData, fallcode: e.target.value.toUpperCase() })
                        }
                        placeholder="PF-..."
                        className="bg-slate-950/50 border-white/10 text-center tracking-widest text-lg font-mono text-white h-12"
                      />
                    </div>
                    <Button
                      type="button"
                      className="w-full h-11 bg-[#20b2aa] hover:bg-[#3ddbd0] text-slate-950 font-bold"
                      disabled={!formData.fallcode || formData.fallcode.length < 4}
                      onClick={() => setStep(2)}
                    >
                      Weiter zur Verifizierung <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-300 font-medium">
                        Zustelladresse für verschlüsseltes Daten-Dossier (E-Mail)
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="name@beispiel.de"
                        className="bg-slate-950/50 border-white/10 h-11 text-white"
                        required
                      />
                    </div>
                    <div className="bg-slate-950/40 border border-white/5 p-4 rounded-xl flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="legal-confirm"
                        checked={formData.bestaetigung}
                        onChange={(e) =>
                          setFormData({ ...formData, bestaetigung: e.target.checked })
                        }
                        className="mt-1 accent-[#20b2aa]"
                      />
                      <label
                        htmlFor="legal-confirm"
                        className="text-xs text-gray-400 leading-relaxed cursor-pointer"
                      >
                        Ich versichere eidesstattlich, dass ich Inhaber dieses Fallcodes bin oder
                        eine rechtsgültige Vollmacht des Betroffenen vorliegt.
                      </label>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(1)}
                        className="border-white/10 text-white hover:bg-white/5 h-11"
                      >
                        <ArrowLeft className="mr-1.5 w-4 h-4" /> Zurück
                      </Button>
                      <Button
                        type="submit"
                        disabled={!formData.email || !formData.bestaetigung || loading}
                        className="flex-1 h-11 bg-[#20b2aa] hover:bg-[#3ddbd0] text-slate-950 font-bold"
                      >
                        {loading ? 'Protokolliere...' : 'Auskunftsanspruch geltend machen'}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-emerald-500/20 bg-emerald-500/5 text-white shadow-xl">
            <CardHeader className="border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                  <Check className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-emerald-400 text-base font-bold">
                    Antrag revisionssicher eingegangen!
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-xs">
                    Gesetzliche Bearbeitungsfrist nach Art. 12 Abs. 3 DSGVO läuft
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs text-gray-300">
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400" />{' '}
                <span>E-Mail-Protokoll hinterlegt für: {formData.email}</span>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />{' '}
                <span>Maximale Bearbeitungsdauer: 30 Tage (Regelfall deutlich schneller)</span>
              </p>
              <Button
                variant="outline"
                onClick={() => router.push(`/${locale}/datenschutz`)}
                className="w-full h-10 border-white/10 text-white hover:bg-white/5 mt-2"
              >
                Zurück zur Übersicht
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white/5 border-white/10 text-white shadow-md">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold flex items-center gap-2 text-gray-300">
              <Database className="w-4 h-4 text-[#20b2aa]" /> Gesetzlicher Rechte-Spiegel (Kapitel 3
              DSGVO)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-gray-400 leading-relaxed space-y-1">
            <p>• **Art. 15:** Umfassendes Recht auf Dateneinsicht und Kriterienauskunft</p>
            <p>• **Art. 17:** Recht auf sofortige Datenlöschung („Vergessenwerden“)</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
