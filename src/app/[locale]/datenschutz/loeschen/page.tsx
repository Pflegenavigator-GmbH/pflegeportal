// src/app/[locale]/datenschutz/loeschen/page.tsx

'use client';

import { Trash2, AlertTriangle, ArrowRight, Check, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, use } from 'react';

import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
} from '@/src/components/ui';

/**
 * Nur die IDs — die Beschriftungen stehen in `rechtliches.loeschen.gruende`.
 * `as const` hält sie als Literale, sonst ließe sich der zusammengesetzte
 * Schlüssel nicht gegen die vorhandenen Einträge prüfen.
 */
const LOESCHGRUENDE = ['nichtMehr', 'unsicher', 'anderes'] as const;

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function DatenLoeschenPage(props: PageProps) {
  const router = useRouter();
  const params = use(props.params);
  const locale = params?.locale || 'de';

  const t = useTranslations('rechtliches.loeschen');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fallcode: '',
    email: '',
    grund: '',
    bestaetigung: false,
  });

  const handleFinalDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Protokollierung über das API-Feedback-Sicherheitsnetz
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bug',
          rating: 1,
          message: `DSGVO Art. 17 LÖSCHBEGEHREN für Fallcode: ${formData.fallcode}. Grund-Kategorie: ${formData.grund}. Bestätigungs-E-Mail: ${formData.email}`,
        }),
      });

      setSubmitted(true);
    } catch {
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white py-12 px-4 font-sans">
      <div className="container mx-auto max-w-2xl space-y-6">
        {/* Akutes Warnbanner */}
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start gap-3 text-rose-400">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong className="text-white block font-bold mb-0.5">{t('warnungTitel')}</strong>
            {t('warnungText')}
          </div>
        </div>

        {!submitted ? (
          <Card className="bg-white/5 border-white/10 text-white shadow-xl">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" /> {t('kartenTitel', { schritt: step })}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={handleFinalDelete} className="space-y-4">
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-300 font-medium">
                        {t('fallcodeLabel')}
                      </label>
                      <Input
                        type="text"
                        value={formData.fallcode}
                        onChange={(e) =>
                          setFormData({ ...formData, fallcode: e.target.value.toUpperCase() })
                        }
                        placeholder={t('fallcodePlatzhalter')}
                        className="bg-slate-950/50 border-white/10 text-center tracking-widest text-lg font-mono text-white h-12"
                      />
                    </div>
                    <Button
                      type="button"
                      className="w-full h-11 bg-rose-500 hover:bg-rose-600 text-white font-bold"
                      disabled={!formData.fallcode || formData.fallcode.length < 4}
                      onClick={() => setStep(2)}
                    >
                      {t('weiter')} <ArrowRight className="ml-1.5 w-4 h-4" />
                    </Button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <label className="text-xs text-gray-300 font-medium block">
                      {t('grundLabel')}
                    </label>
                    <div className="space-y-2">
                      {LOESCHGRUENDE.map((grundId) => (
                        <label
                          key={grundId}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-xs ${formData.grund === grundId ? 'border-rose-500 bg-rose-500/5 text-white' : 'border-white/5 bg-slate-950/20 text-gray-400 hover:border-white/10'}`}
                        >
                          <input
                            type="radio"
                            name="grund"
                            value={grundId}
                            checked={formData.grund === grundId}
                            onChange={(e) => setFormData({ ...formData, grund: e.target.value })}
                            className="accent-rose-500"
                          />
                          <span>{t(`gruende.${grundId}`)}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(1)}
                        className="border-white/10 text-white hover:bg-white/5 h-11"
                      >
                        {t('zurueck')}
                      </Button>
                      <Button
                        type="button"
                        className="flex-1 h-11 bg-rose-500 hover:bg-rose-600 text-white font-bold"
                        disabled={!formData.grund}
                        onClick={() => setStep(3)}
                      >
                        {t('weiter')}
                      </Button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-300 font-medium">{t('emailLabel')}</label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder={t('emailPlatzhalter')}
                        className="bg-slate-950/50 border-white/10 h-11 text-white"
                        required
                      />
                    </div>
                    <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-xl flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="confirm-delete"
                        checked={formData.bestaetigung}
                        onChange={(e) =>
                          setFormData({ ...formData, bestaetigung: e.target.checked })
                        }
                        className="mt-1 accent-rose-500"
                      />
                      <label
                        htmlFor="confirm-delete"
                        className="text-xs text-gray-400 leading-relaxed cursor-pointer"
                      >
                        {t('bestaetigung')}
                      </label>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(2)}
                        className="border-white/10 text-white hover:bg-white/5 h-11"
                      >
                        {t('zurueck')}
                      </Button>
                      <Button
                        type="submit"
                        disabled={!formData.email || !formData.bestaetigung || loading}
                        className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold"
                      >
                        {loading ? t('absendenLaeuft') : t('absenden')}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-emerald-500/20 bg-emerald-500/5 text-white shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-emerald-400 text-base font-bold">
                    {t('erfolgTitel')}
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-xs">
                    {t('erfolgText')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs text-gray-300">
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" /> <span>{t('frist')}</span>
              </p>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/${locale}/datenschutz`)}
                  className="flex-1 h-10 border-white/10 text-white hover:bg-white/5"
                >
                  {t('zumDatenschutz')}
                </Button>
                <Button
                  onClick={() => router.push(`/${locale}`)}
                  className="flex-1 h-10 bg-[#20b2aa] hover:bg-[#3ddbd0] text-slate-950 font-bold"
                >
                  {t('zurStartseite')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
